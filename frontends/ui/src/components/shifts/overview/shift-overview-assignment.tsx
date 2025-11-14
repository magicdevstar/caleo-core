import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
// @mui
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Label from 'src/components/label';
import Grid from "@mui/material/Grid";
// types
import { Assignment, Event, Shift } from 'src/__generated__/resolvers-types'
import { GET_ASSIGNMENT_DESCRIPTION } from 'src/api/assignment';
// hooks
import { useFeatures } from 'src/hooks/use-features';
// components
import { RHFTextField } from 'src/components/hook-form';
import PolygonDrawMap from 'src/components/map/map-polygon';
import { reader } from 'src/layouts/_common/notifications-popover/notification-item';
import ShiftOverviewDetail from './shift-overview-detail';

type Props = {
  event?: Event;
  assignment?: Assignment;
  shift?: Shift;
  isAdminView: boolean;
  isCheckedIn?: boolean;
}

export default function ShiftOverviewAssignment ({ shift, assignment, event, isAdminView, isCheckedIn }: Props) {
  const { officerCheckInOut, mapboxReportingLocation } = useFeatures();

  const radioFrequency = useMemo(() =>
    assignment?.radioFrequency || event?.radioFrequency || 'N/A', [assignment, event]);

  const callSign = useMemo(() =>
    shift?.callSign || assignment?.callSign || 'N/A', [assignment,  shift]);

  const reportingLocation = useMemo(() => {
      let assignmentAddress = assignment?.reportingLocationDetails?.fullAddress;
      if (!mapboxReportingLocation) {
        assignmentAddress = assignment?.reportingLocation;
      }
      if (!assignment?.allowOfficerCheckIn) {
        assignmentAddress = null;
      }
      const address = assignmentAddress ||
        event?.reportingLocation?.fullAddress ||
        'N/A';
  
      return address;
    }, [assignment, event, mapboxReportingLocation]);

  const geoFence = useMemo(() => {
    const coords = [
      (assignment?.allowOfficerCheckIn ? assignment?.geoFence : undefined),
      (event?.allowOfficerCheckIn ? event?.geoFence : undefined),
    ].filter(Boolean);
    return coords;
  }, [assignment,  event]);

  const { data: assignmentNotes } = useQuery(GET_ASSIGNMENT_DESCRIPTION, {
    variables: { id: assignment?.id },
    skip: !assignment,
  });

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <ShiftOverviewDetail label='Name' value={assignment?.name} xs={12} md={6} xl={6} />
        <ShiftOverviewDetail label='Call Sign' value={callSign} tag xs={12} md={6} xl={6}>
          {isAdminView && <RHFTextField name="assignment.callSign" size='small' />}
        </ShiftOverviewDetail>
        {
          isCheckedIn || isAdminView && (
            <>
              <ShiftOverviewDetail label='Branch' value={assignment?.branch?.name} tag xs={12} md={3} xl={3} />
              <ShiftOverviewDetail label='Division' value={assignment?.assignmentDivision?.name} tag xs={12} md={3} xl={3} />
              <ShiftOverviewDetail label='Group' value={assignment?.assignmentGroup?.name} tag xs={12} md={3} xl={3} />
              <ShiftOverviewDetail label='Radio Frequency' value={radioFrequency} tag xs={12} md={3} xl={3} />
              <ShiftOverviewDetail label='Assignment Location' value={reportingLocation} fullRow />
            </>
          )
        }
      </Grid>
      { (isCheckedIn || isAdminView) && officerCheckInOut && geoFence &&
        <Box>
          <PolygonDrawMap initialPolygons={geoFence as any} disabled />
        </Box>
      }
      {
        isCheckedIn || isAdminView && (
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Notes
            </Typography>
            <Label
              sx={{
                padding: '10px !important',
                whiteSpace: 'pre-line',
                height: '100%',
                lineHeight: '1.5rem',
                fontSize: '14px',
                justifyContent: 'flex-start',
                width: '100%',
                alignItems: 'flex-start',
                textTransform: 'none',
              }}
              variant="soft"
              color='default'
            >
              { assignmentNotes?.assignment?.description && assignmentNotes?.assignment?.description?.trim() !== '' ? reader(assignmentNotes?.assignment?.description || '') : 'N/A'}
            </Label>
          </Stack>
        )
      }
    </Stack>
  );
}
