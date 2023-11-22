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
import { Assignment, Event, Shift } from 'src/__generated__/resolvers-types';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// components
import FormProvider, { RHFAutocomplete } from 'src/components/hook-form';
import { GET_ALL_EVENTS_SLIM, GET_EVENT_FOR_REPORT } from 'src/api/event';
import { useDownloadCsv } from 'src/hooks/use-download-csv';
import useDebounceText from 'src/hooks/use-debounce-text';
import { client } from 'src/utils/apollo';
import { convertDate } from 'src/hooks/use-datejs';

const eventsByShiftSchema = Yup.object().shape({
  event: Yup.object()
    .required('You must specify and event'),
});

export default function ShiftsByEvent() {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadCsv({
    fileName: 'shifts-by-event',
    ext: 'csv',
  });

  const {
    text,
    setText,
    debouncedText,
  } = useDebounceText({ ms: 500 });

  let key = 'query';
  let value: string | number | undefined = debouncedText.trim() === '' ? undefined : debouncedText;
  try {
    const number = parseInt(debouncedText?.trim() || '', 10);
    if (!Number.isNaN(number)) {
      key = 'referenceId';
      value = number;
    }
  } catch(error) {
    console.error('Not a number');
  }

  const { data } = useQuery(GET_ALL_EVENTS_SLIM, {
    variables: {
      input: {
        [key]: value,
        limit: 10,
      },
    },
  });
  const options = data?.events?.items || [];

  const defaultValues = useMemo(() => ({
    eventId: undefined,
  } as any), []);

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
          id: values.event.id,
        },
      });
      const { event } = res;
      if (!event) {
        throw new Error('Event not found');
      }

      const shifts: Shift[] = (event.assignments || []).reduce((a: any[], assignment: Assignment) => {
        const aShifts = (assignment.shifts || []).map((shift, index) => ({
          ...shift,
          slotNumber: index + 1,
          assignment,
          event,
        }));
        return [
          ...a,
          ...aShifts,
        ];
      }, []);

      const formattedJson = shifts.map((shift: Shift) => ({
        'Event Name': shift.event.name,
        'Event Ref. #': shift.event.referenceId,
        'Venue Name': shift.event.venue?.name || '',
        'Event Created By P#': shift.event.createdBy?.member?.pNumber || '',
        'Event Start Date': shift.event.startTime ? convertDate({date: event.startTime, user}).format('MM/DD/YYYY') : '',
        'Event End Date': shift.event.endTime ? convertDate({date: event.endTime, user}).format('MM/DD/YYYY') : '',
        'Assignment Name': shift.assignment.name,
        'Shift Start Date': shift.startTime ? convertDate({date: event.startTime, user}).format('MM/DD/YYYY') : '',
        'Shift Start Time': shift.startTime ? convertDate({date: event.startTime, user}).format('HH:mm') : '',
        'Shift End Date': shift.endTime ? convertDate({date: event.endTime, user}).format('MM/DD/YYYY') : '',
        'Shift End Time': shift.endTime ? convertDate({date: event.endTime, user}).format('HH:mm') : '',
        'Slot #': (shift as any).slotNumber,
        'Status': shift.status,
        'Assignee First Name': shift.user?.firstName || '',
        'Assignee Last Name': shift.user?.lastName || '',
        'Assignee P#': shift.user?.member?.pNumber || '',
        'Assignee Primary Phone Number': shift.user?.member?.contactInfo?.primaryPhone?.number || '',
      }));
      download(formattedJson);
    } catch(error) {
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
            disableCloseOnSelect
            openOnFocus
            limitTags={4}
            name="event"
            label="Event Name or Ref. #"
            options={options}
            inputValue={text || ''}
            getOptionLabel={(option: any) => `${option.name} (${option.referenceId})`}
            onInputChange={(_event, newInputValue) => {
              setText(newInputValue);
            }}
            isOptionEqualToValue={(option: Event, v: Event) => option.id === v.id}
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
