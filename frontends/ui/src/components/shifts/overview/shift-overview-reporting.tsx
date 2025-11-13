import { useMemo } from 'react';
// types
import { Assignment, Event, Shift } from 'src/__generated__/resolvers-types'
// @mui
import Stack from '@mui/material/Stack';
import Grid from "@mui/material/Grid";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
// hooks
import { convertDate, useDateFormats } from 'src/hooks/use-datejs';
import { useAuthContext } from 'src/auth/hooks';
// components
import PolygonDrawMap from 'src/components/map/map-polygon';
import Iconify from 'src/components/iconify';
import ShiftOverviewDetail from './shift-overview-detail';

type Props = {
  shift?: Shift;
  event?: Event;
  assignment?: Assignment
}

export default function ShiftOverviewReporting ({ shift, assignment, event }: Props) {
  const { timeFormat } = useDateFormats();
  const { user } = useAuthContext();

  const geoFence = useMemo(() => assignment?.geoFence || event?.geoFence, [assignment,  event]);

  const reportingPin = useMemo(() => {
    if (
      assignment?.reportingLocationDetails?.location &&
      assignment.reportingLocationDetails.location.latitude &&
      assignment.reportingLocationDetails.location.longitude
    ) {
      return [
        assignment.reportingLocationDetails.location.longitude,
        assignment.reportingLocationDetails.location.latitude,
      ]
    }
    if (
      event?.reportingLocation?.location &&
      event.reportingLocation.location.latitude &&
      event.reportingLocation.location.longitude
    ) {
      return [
        event.reportingLocation.location.longitude,
        event.reportingLocation.location.latitude,
      ]
    }

    return null;
  }, [assignment, event]);

  const reportingLocation = useMemo(() =>
    assignment?.reportingLocation || assignment?.reportingLocationDetails?.fullAddress || event?.reportingLocation?.fullAddress || 'N/A', [assignment,  event]);

  const reportingTime = useMemo(() => {
    const rawReportTime = assignment?.reportingTime || event?.reportingTime || shift?.startTime;
    if (!rawReportTime) {
      return null;
    }
    return convertDate({
      date: new Date(rawReportTime),
      user
    }).format(timeFormat);
  }, [shift,assignment, event, timeFormat, user]);

  const briefingTime = useMemo(() => {
    const rawBriefingTime = assignment?.briefingTime || event?.briefingTime;
    if (!rawBriefingTime) {
      return null;
    }
    return convertDate({
      date: new Date(rawBriefingTime),
      user
    }).format(timeFormat);
  }, [assignment, event, timeFormat, user]);

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <ShiftOverviewDetail label='Reporting Time' value={reportingTime} tagColor="primary" tagVariant="filled" tag />
        <ShiftOverviewDetail label='Reporting Location' value={reportingLocation} />
        {geoFence && reportingPin && (
          <Box width="100%">
            <PolygonDrawMap
              initialPolygon={[[]]}
              initialViewState={{
                longitude: reportingPin[0],
                latitude: reportingPin[1],
                zoom: 14,
              }}
              initialPin={reportingPin as any}
              disabled
            />
          </Box>
        )}
        <ShiftOverviewDetail label="Directions" fullRow>
          <Stack direction="row" spacing={1}>
            <Button
              href={`https://maps.apple.com/?daddr=${reportingPin?.[1]},${reportingPin?.[0]}&dirflg=d`}
              target='_blank'
              startIcon={<Iconify icon="cib:apple" />}
              variant='contained'
              size='small'
            >
              Apple Maps
            </Button>
            <Button
              href={`https://www.google.com/maps/dir/?api=1&travelmode=driving&layer=traffic&destination=${reportingPin?.[1]},${reportingPin?.[0]}`}
              target='_blank'
              startIcon={<Iconify icon="cib:google" />}
              variant='contained'
              size='small'
            >
              Google Maps
            </Button>
          </Stack>
        </ShiftOverviewDetail>
        <ShiftOverviewDetail label='Uniform for the Shift' value={assignment?.uniform || event?.uniform || 'N/A'} tag />
        <ShiftOverviewDetail label='Briefing Time' value={briefingTime} tagColor="info" tagVariant="filled" tag />
        <ShiftOverviewDetail label='Briefing Location' value={assignment?.briefingLocation || event?.briefingLocation || 'N/A'} />
      </Grid>
    </Stack>
  );
}
