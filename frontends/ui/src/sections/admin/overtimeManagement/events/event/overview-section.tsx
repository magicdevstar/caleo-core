import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import dayjs from "dayjs";
// @mui
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
// components
import Markdown from "src/components/markdown";
import { RHFAutocomplete, RHFDateTimePicker, RHFSelect, RHFTextField } from "src/components/hook-form";
import { RouterLink } from "src/routes/components";
import { EditSection } from "src/sections/admin/overtimeManagement/events/common/section";
// types
import { Event, EventStatus, Venue, VenueStatus } from "src/__generated__/resolvers-types";
import { GET_VENUE_LIST } from "src/api/venues";
// hooks
import { useFeatures } from "src/hooks/use-features";
import { convertDate, useDateFormats } from "src/hooks/use-datejs";
import { useFormContext } from "react-hook-form";
import { useAuthContext } from "src/auth/hooks";
import useDebounceText from "src/hooks/use-debounce-text";

// ----------------------------------------------------------------------

interface Props {
  disabled?: boolean;
  currentEvent?: Event;
  isIncident?: boolean;
  isComplete?: boolean;
  eventTemplateView?: boolean;
}

// ----------------------------------------------------------------------

export const EventOverviewSection = ({
  disabled,
  isIncident,
  isComplete,
  eventTemplateView,
  currentEvent,
}: Props) => {
  const { user } = useAuthContext();
  const { watch } = useFormContext();
  const { dateTimeFormat } = useDateFormats();
  const { incidentEvents, venueContractDates } = useFeatures();
  const { setText: setVenueSearchText, debouncedText: venueSearch } = useDebounceText({ ms: 500 });
  const selectedVenue = watch('venueId') as Venue | null;
  const startTime = watch('startTime');

  const showVenueContractWarning = useMemo(() => {
    if (!venueContractDates) {
      return false;
    }
    const convertedDate = convertDate({ date: new Date(selectedVenue?.contract?.expirationDate || 0), user });
    if (!selectedVenue?.contract?.expirationDate || convertedDate.isBefore(dayjs())) {
      return true;
    }
    return false;
  }, [venueContractDates, selectedVenue, user]);

  const { data: venueRes, loading: venuesLoading } = useQuery(GET_VENUE_LIST, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        limit: 10,
        orderBy: 'name',
        order: 'asc',
        status: VenueStatus.Active,
        query: venueSearch || undefined,
      },
    },
  });
  const venues = useMemo(() => venueRes?.venues?.items || [], [venueRes]);

  return (
    <EditSection title="Overview" description="Name, type, etc.">
      <RHFTextField
        name="name"
        label="Name"
        disabled={disabled}
        helperText={`Ref #: ${currentEvent?.referenceId || ''}`}
      />

      {!isIncident && (
        <RHFAutocomplete
          openOnFocus
          name="venueId"
          label="Venue Name *"
          disabled={disabled}
          options={venues}
          filterOptions={(x: any) => x}
          loading={venuesLoading}
          helperText={currentEvent?.requestDetails?.estimatedAttendees ? `Estimated attendees: ${currentEvent?.requestDetails?.estimatedAttendees}` : ''}
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
      )}

      {selectedVenue && (
        <Box sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 2 }}>
          <Stack direction="row" spacing={1.5}>
            <Typography variant="subtitle2">Address: </Typography>
            <Typography variant="subtitle2">{ selectedVenue?.address }</Typography>
            <Typography variant="subtitle2">{ `${selectedVenue?.city},` }</Typography>
            <Typography variant="subtitle2">{ selectedVenue?.state }</Typography>
            <Typography variant="subtitle2">{ selectedVenue?.zip }</Typography>
          </Stack>
          {currentEvent?.requestDetails?.estimatedAttendees && <Typography variant="subtitle2">Estimated Attendees: {currentEvent?.requestDetails?.estimatedAttendees}</Typography>}
          {currentEvent?.requestDetails?.numberOfOfficers && <Typography variant="subtitle2">Requested number of officers: {currentEvent?.requestDetails?.numberOfOfficers}</Typography>}
          <Markdown children={selectedVenue?.notes || ''} />
          {showVenueContractWarning && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant='caption' color="grey">⚠️ Venue contract is is expired. Please update the contract or replace the venue.</Typography>
              <Button sx={{ minWidth: '90px' }} component={RouterLink} href={`/dashboard/admin/overtime/venues/${(selectedVenue as any)?.id}`}>Edit venue</Button>
            </Box>
          )}
        </Box>
      )}

      {
        incidentEvents && !currentEvent && (
          <RHFSelect
            fullWidth
            name="status"
            required
            label="Posting type"
            disabled={disabled || isComplete}
            InputLabelProps={{ shrink: true }}
            PaperPropsSx={{ textTransform: 'capitalize' }}
          >
            <MenuItem value={EventStatus.Draft}>Pre Planned</MenuItem>
            <MenuItem value={EventStatus.Incident}>Incident</MenuItem>
          </RHFSelect>
        )
      }

      {incidentEvents && !currentEvent && (
        <>
          { isIncident && (
            <Stack direction="row" spacing={1.5}>
              <RHFDateTimePicker
                timezone={user.member.org?.timezone}
                ampm={false}
                timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                name="startTime"
                label="Start Time"
              />
              <RHFDateTimePicker
                timezone={user.member.org?.timezone}
                minDate={startTime ? dayjs(new Date(startTime)) : dayjs(new Date())}
                timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                ampm={false}
                name="endTime"
                label="End Time"
              />
            </Stack>
          )}
        </>
      )}

      {
        currentEvent && !eventTemplateView && (
          <Stack>
            <Stack direction="row" spacing={1.5}>
              <RHFDateTimePicker
                name="startTime"
                label="Start time"
                timezone={user.member.org?.timezone}
                ampm={false}
                timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                disabled={!isIncident}
                textFieldProps={{
                  fullWidth: true,
                    margin: 'normal',
                    ...(currentEvent.requestDetails?.startTime ? {
                      helperText: `Suggested start time: ${convertDate({ date: currentEvent.requestDetails?.startTime, user }).format(dateTimeFormat)}`
                    } : {}),
                }}
              />

              <RHFDateTimePicker
                name="endTime"
                label="End Time"
                timezone={user.member.org?.timezone}
                ampm={false}
                disabled={!isIncident}
                timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                textFieldProps={{
                  fullWidth: true,
                    margin: 'normal',
                    ...(currentEvent.requestDetails?.endTime ? {
                      helperText: `Suggested end time: ${convertDate({ date: currentEvent.requestDetails?.endTime, user }).format(dateTimeFormat)}`
                    } : {}),
                }}
              />
            </Stack>
            { !isIncident && (
              <Typography color="grey" variant="subtitle2">The start and end time are calculated based on the open shifts.</Typography>
            )}
          </Stack>
        )
      }
    </EditSection>
  );
}