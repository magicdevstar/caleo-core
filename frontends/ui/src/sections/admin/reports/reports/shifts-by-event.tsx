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
import CircularProgress from '@mui/material/CircularProgress';
import LoadingButton from '@mui/lab/LoadingButton';
// Types
import { Assignment, Event, Shift, ShiftStatus } from 'src/__generated__/resolvers-types';
// hooks
import { useAuthContext } from 'src/auth/hooks';
import useDebounceText from 'src/hooks/use-debounce-text';
// components
import FormProvider, { RHFAutocomplete } from 'src/components/hook-form';
import { GET_ALL_EVENTS_SLIM, GET_EVENT_FOR_REPORT } from 'src/api/event';
import { useDownloadCsv } from 'src/hooks/use-download-csv';
import { client } from 'src/utils/apollo';
import { convertDate, dateFormat, dateTimeFormat, timeFormat } from 'src/hooks/use-datejs';
import { useFeatures } from 'src/hooks/use-features';
import { usePNumberLabel } from 'src/hooks/use-pNumber-label';

const eventsByShiftSchema = Yup.object().shape({
  event: Yup.mixed<Event | string>()
    .nullable()
    .transform((value: Event) => value?.id)
    .test('event-required', 'You must specify an Event', (value) => !!value),
});

export default function ShiftsByEvent() {
  const { user } = useAuthContext();
  const { pNumberLabel } = usePNumberLabel();
  const { equipment, lasdEventFields } = useFeatures();
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadCsv({
    fileName: 'shifts-by-event',
    ext: 'csv',
  });

  const { text, setText, debouncedText } = useDebounceText({ ms: 500 });

  const inputFields = useMemo(() => {
    const trimmedValue = debouncedText.trim();
    let key = 'query';
    let value: string | number | undefined = trimmedValue === '' ? undefined : trimmedValue;
    try {
      const number = parseInt(value || '', 10);
      const isNum = /^\d{6}$/.test(value || '');
      if (isNum && !Number.isNaN(number)) {
        key = 'referenceIds';
        value = number;
      }
    } catch (error) {
      console.error('Not a number');
    }

    return {
      key,
      value,
    };
  }, [debouncedText]);

  const { data, loading: loadingEvents } = useQuery(GET_ALL_EVENTS_SLIM, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    variables: {
      input: {
        [inputFields.key]: inputFields.key === 'query' ? inputFields.value : [inputFields.value],
        limit: 10,
      },
    },
  });
  const options = useMemo(() => data?.events?.items || [], [data]);

  const defaultValues = useMemo(
    () =>
      ({
        event: null,
      }) as any,
    []
  );

  const methods = useForm({
    mode: 'onTouched',
    resolver: yupResolver(eventsByShiftSchema),
    defaultValues,
  });

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      // I guess I could have just done a search for shifts but for whatever reason this feels more efficient 🤷‍♂️
      const { data: res } = await client.query({
        query: GET_EVENT_FOR_REPORT,
        variables: {
          id: values.event,
        },
      });
      const { event } = res;
      if (!event) {
        throw new Error('Event not found');
      }

      const shifts: Shift[] = (event.assignments || []).reduce(
        (a: any[], assignment: Assignment) => {
          const aShifts = (assignment.shifts || []).map((shift, index) => ({
            ...shift,
            assignment,
            event,
          }));
          return [...a, ...aShifts];
        },
        []
      );

      const formattedJson = shifts.map((shift: Shift) => ({
        'Event Name': shift.event.name,
        'Event Ref. #': shift.event.referenceId,
        ...(lasdEventFields ? {
          'OCN': event.ocn || '-',
          'Admin Time (Hours)': event.adminTime || '-',
        } : {}),
        ...(equipment ? {
          'Required Equipment': (shift.assignment.requiredEquipment || [{name: 'N/A'}])?.map(({ name }: any) => name).join(','),
        } : {}),
        'Venue Name': shift.event.venue?.name || '',
        [`Event Created By ${pNumberLabel}`]: shift.event.createdBy?.member?.pNumber || '',
        'Event Start Date': shift.event.startTime
          ? convertDate({ date: event.startTime, user }).format(dateTimeFormat)
          : '',
        'Event End Date': shift.event.endTime
          ? convertDate({ date: event.endTime, user }).format(dateTimeFormat)
          : '',
        'Assignment Name': shift.assignment.name,
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
        'Slot #': shift.refNumber,
        Status:
          Object.keys(ShiftStatus).find(
            (status) => ShiftStatus[status as keyof typeof ShiftStatus] === shift.status
          ) || shift.status,
        'Assignee First Name': shift.user?.firstName || '',
        'Assignee Last Name': shift.user?.lastName || '',
        [`Assignee ${pNumberLabel}`]: shift.user?.member?.pNumber || '',
        'Assignee Primary Phone Number':
          shift.user?.member?.contactInfo?.primaryPhone?.number || '',
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
            sm: '1fr',
          }}
        >
          <RHFAutocomplete
            openOnFocus
            name="event"
            label="Event Name or Ref. #"
            options={options}
            inputValue={text || ''}
            filterOptions={(x: any) => x}
            loading={loadingEvents}
            loadingText={
              <>
                Loading...
                <CircularProgress color="inherit" size={14} sx={{ ml: 1.5 }} />
              </>
            }
            getOptionLabel={(option: any) => (option as Event).name}
            isOptionEqualToValue={(option: Event, v: Event) => option.id === v.id}
            onInputChange={(_event, newInputValue) => {
              setText(newInputValue);
            }}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {`${option.name} (${option.referenceId})`}
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
