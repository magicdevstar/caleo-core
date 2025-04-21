import { useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { useQuery } from '@apollo/client';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';
// Types
import { Shift, ShiftStatus, User } from 'src/__generated__/resolvers-types';
import { GET_USERS } from 'src/api/user';
import { GET_OFFICER_REPORT_SHIFTS } from 'src/api/shifts';
// hooks
import { useAuthContext } from 'src/auth/hooks';
import useDebounceText from 'src/hooks/use-debounce-text';
// components
import FormProvider, { RHFAutocomplete } from 'src/components/hook-form';
import RHFDateRangePicker from 'src/components/hook-form/rhf-date-range';
import { client } from 'src/utils/apollo';
import { convertDate, dateFormat, dateTimeFormat, timeFormat } from 'src/hooks/use-datejs';
import { useDownloadCsv } from 'src/hooks/use-download-csv';
import { useFeatures } from 'src/hooks/use-features';
import { usePNumberLabel } from 'src/hooks/use-pNumber-label';
import { formattedStatus } from 'src/utils/shiftStatus';

const shiftsByOfficerSchema = Yup.object().shape({
  dateRange: Yup.array()
    .required('You must specify a date range')
    .test('has-dates', 'Must select min and max date', (value, context) => {
      const hasMin = value[0];
      const hasMax = value[1];
      return !!hasMin && !!hasMax;
    }),
  shiftStatus: Yup.array()
    .of(Yup.mixed<(typeof formattedStatus)[0] | string>())
    .transform((value: typeof formattedStatus) => value.map((v) => v.value)),
  createdBy: Yup.array()
    .of(Yup.mixed<User | string>())
    .transform((value: User[]) => value.map((v) => v.id)),
});

export default function ShiftsByDate() {
  const { user } = useAuthContext();
  const { pNumberLabel } = usePNumberLabel();
  const { equipment, lasdEventFields } = useFeatures();
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadCsv({
    fileName: 'shifts-by-date',
    ext: 'csv',
  });

  const { text, setText, debouncedText } = useDebounceText({ ms: 500 });

  const { data, loading: usersLoading } = useQuery(GET_USERS, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    variables: {
      input: {
        admin: true,
        orderBy: 'createdAt',
        order: 'desc',
        limit: 10,
        query: debouncedText || undefined,
      },
    },
  });
  const users: User[] = useMemo(() => data?.users?.items || [], [data]);

  const defaultValues = useMemo(
    () =>
      ({
        dateRange: undefined,
        createdBy: [],
        shiftStatus: [],
      }) as any,
    []
  );

  const methods = useForm({
    mode: 'onTouched',
    resolver: yupResolver(shiftsByOfficerSchema),
    defaultValues,
  });

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const { data: res } = await client.query({
        query: GET_OFFICER_REPORT_SHIFTS,
        variables: {
          input: {
            includeRemoved: true,
            ...(values.createdBy.length > 0 && { createdById: values.createdBy }),
            ...(values.shiftStatus.length > 0 && { status: values.shiftStatus }),
            range: {
              startTime: {
                gte: values.dateRange[0].toDate().toISOString(),
              },
              endTime: {
                lte: values.dateRange[1].toDate().toISOString(),
              },
            },
          },
        },
      });
      const shifts = res.shifts.items;
      if (shifts.length === 0) {
        enqueueSnackbar('No data. Please try a different set of filters.', {
          variant: 'info',
          autoHideDuration: 3000,
        });
        return;
      }
      const formattedJson = shifts.map((shift: Shift) => ({
        [`Officer ${pNumberLabel}`]: shift.user?.member?.pNumber || '',
        'Officer First Name': shift.user?.firstName || '',
        'Officer Last Name': shift.user?.lastName || '',
        'Phone Number': shift.user?.member?.contactInfo?.primaryPhone?.number || '',
        'Event Ref. #': shift?.event?.referenceId,
        ...(lasdEventFields ? {
          'OCN': shift?.event?.ocn || '-',
        } : {}),
        ...(equipment ? {
          'Required Equipment': (shift?.assignment?.requiredEquipment || [{name: 'N/A'}])?.map(({ name }: any) => name).join(','),
        } : {}),
        [`Event Created By ${pNumberLabel}`]: shift.event?.createdBy?.member?.pNumber || '',
        'Event Name': shift?.event?.name || '',
        'Venue Name': shift.event?.venue?.name || '',
        'Event Start Date': shift.event?.startTime
          ? convertDate({ date: shift.event.startTime, user }).format(dateTimeFormat)
          : '',
        'Event End Date': shift.event?.endTime
          ? convertDate({ date: shift.event.endTime, user }).format(dateTimeFormat)
          : '',
        'Assignment Name': shift.assignment?.name,
        'Shift Start Date': shift.startTime
          ? convertDate({ date: shift.startTime, user }).format(dateFormat)
          : '',
        'Shift Start Time': shift.startTime
          ? convertDate({ date: shift.startTime, user }).format(timeFormat)
          : '',
        'Shift End Date': shift.endTime
          ? convertDate({ date: shift.endTime, user }).format(dateFormat)
          : '',
        'Shift End Time': shift.endTime
          ? convertDate({ date: shift.endTime, user }).format(timeFormat)
          : '',
        Status:
          formattedStatus.find((status) => status.value === shift.status)?.label || shift.status,
      }));
      download(formattedJson);
    } catch (error) {
      enqueueSnackbar('Error creating report', { variant: 'error', autoHideDuration: 3000 });
      console.error(error);
    }
  });

  return (
    <Card
      sx={{
        p: 3,
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Search Criteria
        </Typography>
        <Box
          display="grid"
          rowGap={3}
          columnGap={2}
          sx={{
            mb: 4,
          }}
          gridTemplateColumns={{
            sm: 'repeat(1, 1fr)',
            lg: '1fr 33.3% 33.3%',
          }}
        >
          <RHFDateRangePicker
            sx={{ width: '100%' }}
            name="dateRange"
            label="Date Range *"
            calendars={1}
            timezone={user?.member?.org?.timezone}
          />
          <RHFAutocomplete
            multiple
            disableCloseOnSelect
            openOnFocus
            limitTags={4}
            name="shiftStatus"
            label="Shift Status"
            options={formattedStatus}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.value}>
                <Checkbox style={{ marginRight: 8 }} checked={selected} />
                {option.label}
              </li>
            )}
          />
          <RHFAutocomplete
            multiple
            disableCloseOnSelect
            openOnFocus
            name="createdBy"
            label="Created By"
            options={users}
            inputValue={text || ''}
            loading={usersLoading}
            loadingText={
              <>
                Loading...
                <CircularProgress color="inherit" size={14} sx={{ ml: 1.5 }} />
              </>
            }
            getOptionLabel={(option) => (option as User).name}
            filterOptions={(x: any) => x}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onInputChange={(_event, newInputValue) => {
              setText(newInputValue);
            }}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.id}>
                <Checkbox style={{ marginRight: 8 }} checked={selected} />
                {option.name}
              </li>
            )}
          />
        </Box>
        <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
          <LoadingButton type="submit" variant="contained" loading={methods.formState.isSubmitting}>
            Create Report
          </LoadingButton>
        </Stack>
      </FormProvider>
    </Card>
  );
}
