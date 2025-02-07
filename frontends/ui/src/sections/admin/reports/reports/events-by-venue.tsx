import { useSnackbar } from 'notistack';
import { useMemo } from 'react';
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
import { Event, EventStatus, Venue, VenueStatus } from 'src/__generated__/resolvers-types';
import { GET_VENUE_LIST } from 'src/api/venues';
// hooks
import { useAuthContext } from 'src/auth/hooks';
import useDebounceText from 'src/hooks/use-debounce-text';
// components
import FormProvider, { RHFAutocomplete } from 'src/components/hook-form';
import RHFDateRangePicker from 'src/components/hook-form/rhf-date-range';
import { client } from 'src/utils/apollo';
import { GET_ALL_EVENTS } from 'src/api/event';
import { convertDate, dateTimeFormat } from 'src/hooks/use-datejs';
import { useDownloadCsv } from 'src/hooks/use-download-csv';
import { useFeatures } from 'src/hooks/use-features';
import { usePNumberLabel } from 'src/hooks/use-pNumber-label';

const eventStatusOptions = [
  {
    label: 'Draft',
    value: EventStatus.Draft,
  },
  {
    label: 'Pre First Come First Serve',
    value: EventStatus.PreFirstComeFirstServe,
  },
  {
    label: 'First Come First Serve',
    value: EventStatus.FirstComeFirstServe,
  },
  {
    label: 'Pre Lottery',
    value: EventStatus.PreLottery,
  },
  {
    label: 'Lottery',
    value: EventStatus.ReadyForLottery,
  },
  {
    label: 'Complete',
    value: EventStatus.Complete,
  },
  {
    label: 'Removed',
    value: EventStatus.Removed,
  },
];

const eventsByVenueSchema = Yup.object().shape({
  venueName: Yup.array()
    .of(Yup.mixed<Venue | string>())
    .min(1, 'At least one Venue Name is required')
    .transform((value: Venue[]) => value.map((v) => v.id)),
  dateRange: Yup.array()
    .required('You must specify a date range')
    .test('has-dates', 'Must select min and max date', (value, context) => {
      const hasMin = value[0];
      const hasMax = value[1];
      return !!hasMin && !!hasMax;
    }),
  eventStatus: Yup.array()
    .of(Yup.mixed<(typeof eventStatusOptions)[0] | string>())
    .transform((value: typeof eventStatusOptions) => value.map((v) => v.value)),
});

export default function EventsByVenue() {
  const { user } = useAuthContext();
  const { pNumberLabel } = usePNumberLabel();
  const { lasdEventFields } = useFeatures();
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadCsv({
    fileName: 'events-by-venue',
    ext: 'csv',
  });

  const { text, setText, debouncedText } = useDebounceText({ ms: 500 });

  const { data, loading: venuesLoading } = useQuery(GET_VENUE_LIST, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    variables: {
      input: {
        limit: 10,
        orderBy: 'createdAt',
        order: 'desc',
        status: [VenueStatus.Active, VenueStatus.Inactive],
        query: debouncedText || undefined,
      },
    },
  });
  const venues: Venue[] = useMemo(() => data?.venues?.items || [], [data]);

  const defaultValues = useMemo(
    () =>
      ({
        venueName: [],
        dateRange: undefined,
        eventStatus: [],
      }) as any,
    []
  );

  const methods = useForm({
    mode: 'onTouched',
    resolver: yupResolver(eventsByVenueSchema),
    defaultValues,
  });

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const { data: res } = await client.query({
        query: GET_ALL_EVENTS,
        variables: {
          input: {
            includeRemoved: true,
            ...(values.eventStatus.length > 0 && { status: values.eventStatus }),
            ...(values.venueName.length > 0 && { venueIds: values.venueName }),
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
      const events = res.events.items;
      if (events.length === 0) {
        enqueueSnackbar('No data. Please try a different set of filters.', {
          variant: 'info',
          autoHideDuration: 3000,
        });
        return;
      }
      const formattedJson = events.map((event: Event) => ({
        'Venue Name': event.venue?.name || '',
        'Event Name': event.name,
        'Event Ref. #': event.referenceId,
        ...(lasdEventFields ? {
          'OCN': event.ocn || '-',
          'Admin Time (Hours)': event.adminTime || '-',
        } : {}),
        [`Event Created By ${pNumberLabel}`]: event.createdBy?.member?.pNumber || '',
        'Event Start Date': event.startTime
          ? convertDate({ date: event.startTime, user }).format(dateTimeFormat)
          : '',
        'Event End Date': event.endTime
          ? convertDate({ date: event.endTime, user }).format(dateTimeFormat)
          : '',
        'Event Status':
          eventStatusOptions.find((status) => status.value === event.status)?.label || event.status,
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
            name="venueName"
            label="Venue Name *"
            options={venues}
            inputValue={text || ''}
            filterOptions={(x: any) => x}
            loading={venuesLoading}
            loadingText={
              <>
                Loading...
                <CircularProgress color="inherit" size={14} sx={{ ml: 1.5 }} />
              </>
            }
            getOptionLabel={(option) => (option as Venue).name}
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
          <RHFAutocomplete
            multiple
            disableCloseOnSelect
            openOnFocus
            limitTags={4}
            name="eventStatus"
            label="Event Status"
            options={eventStatusOptions}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.value}>
                <Checkbox style={{ marginRight: 8 }} checked={selected} />
                {option.label}
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
