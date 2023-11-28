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
import Box from '@mui/material/Box';
import { LoadingButton } from '@mui/lab';
// Types
import { Shift, ShiftStatus, User } from 'src/__generated__/resolvers-types';
import { GET_USERS } from 'src/api/user';
import { GET_OFFICER_REPORT_SHIFTS } from 'src/api/shifts';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// components
import FormProvider, { RHFAutocomplete } from 'src/components/hook-form';
import RHFDateRangePicker from 'src/components/hook-form/rhf-date-range';
import { client } from 'src/utils/apollo';
import { convertDate } from 'src/hooks/use-datejs';
import { useDownloadCsv } from 'src/hooks/use-download-csv';

const relinquishedShiftsByOfficerSchema = Yup.object().shape({
  officer: Yup.mixed<User | string>()
    .nullable()
    .transform((value: User) => value?.id)
    .test('officer-required', 'An Officer is required', (value) => !!value),
  relinquishedDateRange: Yup.array().notRequired(),
});

export default function RelinquishedShiftsByOfficer() {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadCsv({
    fileName: 'relinquished-shifts-by-officer',
    ext: 'csv',
  });
  const { data, loading: usersLoading } = useQuery(GET_USERS, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    variables: {
      input: {
        orderBy: 'createdAt',
        order: 'desc',
        limit: 100,
      },
    },
  });
  const users: User[] = useMemo(() => data?.users?.items || [], [data]);

  const defaultValues = useMemo(
    () =>
      ({
        officer: null,
        relinquishedDateRange: undefined,
      }) as any,
    []
  );

  const methods = useForm({
    mode: 'onTouched',
    resolver: yupResolver(relinquishedShiftsByOfficerSchema),
    defaultValues,
  });

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const { data: res } = await client.query({
        query: GET_OFFICER_REPORT_SHIFTS,
        variables: {
          input: {
            includeRemoved: true,
            status: [ShiftStatus.Relinquished],
            userId: values.officer,
            ...(values.relinquishedDateRange && {
              range: {
                removedAt: {
                  gte: values.relinquishedDateRange[0].toDate().toISOString(),
                  lte: values.relinquishedDateRange[1].toDate().toISOString(),
                },
              },
            }),
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
        'Officer First Name': shift.user?.firstName || '',
        'Officer Last Name': shift.user?.lastName || '',
        'Officer P#': shift.user?.member?.pNumber || '',
        'Relinquished On': shift?.removedAt
          ? convertDate({ date: shift.removedAt, user }).format('MM/DD/YYYY')
          : '',
        'Relinquished Reason': shift?.relinquishNote || '',
        'Event Ref. #': shift?.event?.referenceId,
        'Event Name': shift?.event?.name || '',
        'Venue Name': shift.event?.venue?.name || '',
        'Event Start Date': shift.event?.startTime
          ? convertDate({ date: shift.event.startTime, user }).format('MM/DD/YYYY')
          : '',
        'Event End Date': shift.event?.endTime
          ? convertDate({ date: shift.event.endTime, user }).format('MM/DD/YYYY')
          : '',
        'Assignment Name': shift.assignment?.name,
        'Shift Start Date': shift.startTime
          ? convertDate({ date: shift.startTime, user }).format('MM/DD/YYYY')
          : '',
        'Shift Start Time': shift.startTime
          ? convertDate({ date: shift.startTime, user }).format('HH:mm')
          : '',
        'Shift End Date': shift.endTime
          ? convertDate({ date: shift.endTime, user }).format('MM/DD/YYYY')
          : '',
        'Shift End Time': shift.endTime
          ? convertDate({ date: shift.endTime, user }).format('HH:mm')
          : '',
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
            lg: '50% 1fr',
          }}
        >
          <RHFAutocomplete
            openOnFocus
            name="officer"
            label="Officer Name or P# *"
            options={users}
            loading={usersLoading}
            getOptionLabel={(option) => (option as User).name}
            filterOptions={(options, state) =>
              options.filter(
                (option: User) =>
                  option.name.toLowerCase().includes(state.inputValue.toLowerCase()) ||
                  option.member?.pNumber?.includes(state.inputValue)
              )
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {`${option.name} (#${option.member?.pNumber})`}
              </li>
            )}
          />
          <RHFDateRangePicker
            sx={{ width: '100%' }}
            name="relinquishedDateRange"
            label="Relinquished on Date Range"
            calendars={1}
            timezone={user?.member?.org?.timezone}
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
