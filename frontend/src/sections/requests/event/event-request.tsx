import { useMemo, useCallback, useEffect } from 'react';
import { StringParam, useQueryParam } from "use-query-params";
import * as Yup from 'yup';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
import useDebounceText from 'src/hooks/use-debounce-text';
// routes
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
// types
import {
  EventStatus,
  Venue,
} from 'src/__generated__/resolvers-types';
// components
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFAutocomplete,
  RHFEditor,
  RHFSelect,
  RHFTextField,
  RHFDateTimePicker,
} from 'src/components/hook-form';
import Markdown from 'src/components/markdown';
import useSWR from 'swr';
import { APOLLO_API } from 'src/config-global';
import RHFPhoneField from 'src/components/hook-form/rhf-phone-field';
import { states } from 'src/utils/states';

// ----------------------------------------------------------------------

const PUBLIC_VENUE_ENDPOINT = `${APOLLO_API}/public/venues`;
const PUBLIC_EVENT_ENDPOINT = `${APOLLO_API}/public/event`;
const NEW_VENUE_ID = 'new-venue';
const DEFAULT_FORM_DATA = {
  name: '',
  companyName: '',
  numberOfOfficers: 0,
  estimatedAttendees: 0,
  startTime: '',
  endTime: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  contact: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  },
  status: EventStatus.Requested,
  notes: '',
  venueId: null,
};

const NewEventSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  companyName: Yup.string().optional(),
  numberOfOfficers: Yup.number().required('Must suggest a number of officers for this event'),
  estimatedAttendees: Yup.number().required('Must suggest a number of officers for this event'),
  status: Yup.string(),
  notes: Yup.string(),
  startTime: Yup.string(),
  endTime: Yup.string(),
  venueId: Yup.mixed<Venue | string>()
    .nullable()
    .transform((value: Venue) => value?.id)
    .test('venue-required', 'Venue is Required', (value) => !!value),
  address: Yup.string().optional(),
  city: Yup.string().optional(),
  state: Yup.string().optional(),
  zip: Yup.string().optional(),
  phone: Yup.string().optional(),
  contact: Yup.object().shape({
    firstName: Yup.string().optional(),
    lastName: Yup.string().optional(),
    email: Yup.string().optional(),
    phone: Yup.string().optional(),
  }).optional(),
});

dayjs.extend(utc);
dayjs.extend(timezone);

export default function EventRequest() {
  const mdUp = useResponsive('up', 'md');
  const [orgId] = useQueryParam('orgId', StringParam, {
    updateType: 'replace',
  });
  const { setText: setVenueSearchText, debouncedText: venueSearch } = useDebounceText({ ms: 500 });

  useEffect(() => {
    if (!orgId) {
      window.location.href = '/';
    }
  }, [orgId]);

  const { data: venueRes, isLoading: venuesLoading } = useSWR(
    [
      PUBLIC_VENUE_ENDPOINT,
      venueSearch,
      orgId,
    ],
    async () => {
      const res = await fetch(`${PUBLIC_VENUE_ENDPOINT}?orgId=${orgId}&query=${encodeURIComponent(venueSearch)}`);
      return res.json();
    },
    {
      refreshInterval: 0,
    },
  );
  const venues = useMemo(() => [
    { id: NEW_VENUE_ID, name: '[Create new venue]' },
    ...(venueRes?.items || [])
  ], [venueRes]);

  const { enqueueSnackbar } = useSnackbar();

  const defaultValues = useMemo(
    () => DEFAULT_FORM_DATA,
    []
  );

  const methods = useForm({
    resolver: yupResolver(NewEventSchema),
    mode: 'onChange',
    defaultValues,
  });

  const {
    handleSubmit,
    watch,
    setError,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  // venueId is initially a venue object until it is transformed after form submit through schema
  const selectedVenue = values.venueId as Venue | null;

  const formSubmit = useCallback(async (formData: any) => {
    try {
      const submitData: any = {
        event: {
          name: formData.name,
          status: formData.status,
          notes: formData.notes,
          requestDetails: {
            numberOfOfficers: formData.numberOfOfficers,
            estimatedAttendees: formData.estimatedAttendees,
            startTime: formData.startTime,
            endTime: formData.endTime,
            newVenue: formData.venueId === NEW_VENUE_ID,
            requestorEmail: formData.contact.email,
          },
        },
      };
      let hasError = false;
      if (submitData.event.requestDetails.newVenue) {
        if (!formData.companyName) {
          setError('companyName', { type: 'custom', message: 'Venue name is required when creating a new venue.' });
          hasError = true;
        }
        if (!formData.contact.firstName) {
          setError('contact.firstName', { type: 'custom', message: 'First name is required when creating a new venue.' });
          hasError = true;
        }
        if (!formData.contact.lastName) {
          setError('contact.lastName', { type: 'custom', message: 'Last name is required when creating a new venue.' });
          hasError = true;
        }
        if (!formData.contact.phone) {
          setError('contact.phone', { type: 'custom', message: 'Phone is required when creating a new venue.' });
          hasError = true;
        }
        if (!formData.phone) {
          setError('phone', { type: 'custom', message: 'Phone is required when creating a new venue.' });
          hasError = true;
        }
        if (!formData.zip) {
          setError('zip', { type: 'custom', message: 'Zip is required when creating a new venue.' });
          hasError = true;
        }
        if (!formData.state) {
          setError('state', { type: 'custom', message: 'State is required when creating a new venue.' });
          hasError = true;
        }
        if (!formData.city) {
          setError('city', { type: 'custom', message: 'City is required when creating a new venue.' });
          hasError = true;
        }
        if (!formData.address) {
          setError('address', { type: 'custom', message: 'Address is required when creating a new venue.' });
          hasError = true;
        }
        submitData.venue = {
          name: formData.companyName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          phone: formData.phone,
          contact: formData.contact,
        };
      } else {
        submitData.event.venueId = formData.venueId;
      }
      if (!formData.contact.email) {
        setError('contact.email', { type: 'custom', message: 'Contact email is required.' });
        hasError = true;
      }
      if (!formData.startTime) {
        setError('startTime', { type: 'custom', message: 'Must have a start time set for this event.' });
        hasError = true;
      }
      if (!formData.endTime) {
        setError('endTime', { type: 'custom', message: 'Must have an end time set for this event.' });
        hasError = true;
      }
      submitData.event.requestDetails.startTime = new Date(formData.startTime).toISOString();
      submitData.event.requestDetails.endTime = new Date(formData.endTime).toISOString();
      if (dayjs(new Date(formData.endTime)).isBefore(dayjs(new Date(formData.startTime)))) {
        setError('endTime', { type: 'custom', message: 'Must be after the start time.' });
        hasError = true;
      }
      if (!formData.numberOfOfficers) {
        setError('numberOfOfficers', { type: 'custom', message: 'Number of officers should be a non zero value.' });
        hasError = true;
      }
      if (!formData.estimatedAttendees) {
        setError('estimatedAttendees', { type: 'custom', message: 'Estimated attendees should be a non zero value.' });
        hasError = true;
      }
      if (!hasError) {
        await fetch(PUBLIC_EVENT_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orgId,
            ...submitData
          })
        });
        enqueueSnackbar('Successfully submitted event request', { variant: 'success', autoHideDuration: 5000 });
      }
    } catch (error) {
      console.log(error);
      enqueueSnackbar('Failed to request event. Please try again.', { variant: 'error' });
    }
  }, [
    orgId,
    setError,
    enqueueSnackbar
  ]);

  const onSubmit = handleSubmit(async (formData: any) => {
    await formSubmit(formData);
  });

  const renderEventDetails = (
    <>
      {mdUp && (
        <Grid md={2}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Event Details
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Name, duration, sizing, and notes
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={10}>
        <Card>
          {!mdUp && <CardHeader title="Event Details" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField
              name="name"
              label="Name of Event"
            />
            <Stack direction="row" spacing={1.5}>
              <RHFDateTimePicker name="startTime" label="Start Time" />
              <RHFDateTimePicker name="endTime" label="End Time" />
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <RHFTextField
                type='number'
                name="numberOfOfficers"
                label="Requested number of officers"
              />
              <RHFTextField
                type='number'
                name="estimatedAttendees"
                label="Requested number of attendees"
              />
            </Stack>
            <Stack spacing={1.5} sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ml: 0.5}}>Notes</Typography>
              <RHFEditor simple name="notes" />
            </Stack>
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderVenueDetails = (
    <>
      {mdUp && (
        <Grid md={2}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Venue Details
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Name, address, general phone number
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={10}>
        <Card>
          {!mdUp && <CardHeader title="Venue Details" />}

          <Stack spacing={3} sx={{ p: 3 }}>
          <RHFAutocomplete
              openOnFocus
              name="venueId"
              label="Venue Name *"
              options={venues}
              filterOptions={(x: any) => x}
              loading={venuesLoading}
              loadingText={
                <>
                  Loading...
                  <CircularProgress color="inherit" size={14} sx={{ ml: 1.5 }} />
                </>
              }
              getOptionLabel={(option) => (option as Venue).name}
              isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
              onInputChange={(event, newInputValue) => {
                if (event) {
                  setVenueSearchText(newInputValue);
                }
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              )}
            />

            {selectedVenue && selectedVenue.id !== NEW_VENUE_ID && (
              <>
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 2 }}>
                    <Stack direction="row" spacing={1.5}>
                      <Typography variant="subtitle2">Address: </Typography>
                      <Typography variant="subtitle2">{ selectedVenue?.address }</Typography>
                      <Typography variant="subtitle2">{ `${selectedVenue?.city},` }</Typography>
                      <Typography variant="subtitle2">{ selectedVenue?.state }</Typography>
                      <Typography variant="subtitle2">{ selectedVenue?.zip }</Typography>
                    </Stack>
                    <Markdown children={selectedVenue?.notes || ''} />
                  </Box>
                </Box>
                <Stack spacing={2}>
                  <RHFTextField
                    name="contact.email"
                    label="Contact Email"
                    helperText="You will receive request notifications to this email address"
                  />
                </Stack>
              </>
            )}

            {
              selectedVenue && selectedVenue.id === NEW_VENUE_ID && (
                <>
                  <RHFTextField
                    name="companyName"
                    label="Name of Venue"
                  />
                  <RHFTextField name="address" label="Address" />
                  <Stack direction="row" spacing={2}>
                    <RHFTextField name="city" label="City" />
                    <RHFSelect
                      name="state"
                      label="State"
                    >
                      {states.map(({ abbreviation: option }) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </RHFSelect>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <RHFTextField name="zip" label="Zip Code" />
                    <RHFPhoneField name="phone" label="Phone" />
                  </Stack>

                  <Stack spacing={2}>
                    <Typography variant='body1'>Venue Contact</Typography>
                    <Stack direction="row" spacing={2}>
                      <RHFTextField name="contact.firstName" label="First Name" />
                      <RHFTextField name="contact.lastName" label="Last Name" />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <RHFTextField
                        name="contact.email"
                        label="Email"
                        helperText="You will receive request notifications to this email address"
                      />
                      <RHFPhoneField name="contact.phone" label="Phone" />
                    </Stack>
                  </Stack>
                </>
              )
            }
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderActions = (
    <>
      {mdUp && <Grid md={4} />}
      <Grid xs={12} md={8} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Button
          component={RouterLink}
          variant='outlined'
          size="large"
          href={paths.dashboard.admin.overtime.events}
        >Cancel</Button>
        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
          sx={{ ml: 2 }}
        >
          Submit Event Request
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3} sx={{ pt: 17 }}>
        {renderEventDetails}

        {renderVenueDetails}

        {renderActions}
      </Grid>
    </FormProvider>
  );
}
