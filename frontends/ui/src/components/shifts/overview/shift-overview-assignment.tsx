import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
// @mui
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Label from 'src/components/label';
import Grid from "@mui/material/Grid";
import Button from '@mui/material/Button';
// types
import { Assignment, Event, Shift } from 'src/__generated__/resolvers-types'
import { GET_ASSIGNMENT_DESCRIPTION } from 'src/api/assignment';
// components
import { RHFTextField } from 'src/components/hook-form';
import PolygonDrawMap from 'src/components/map/map-polygon';
import { reader } from 'src/layouts/_common/notifications-popover/notification-item';
import Iconify from 'src/components/iconify';
import ShiftOverviewDetail from './shift-overview-detail';

type Props = {
  event?: Event;
  assignment?: Assignment;
  shift?: Shift;
  isAdminView: boolean;
  isCheckedIn?: boolean;
}

export default function ShiftOverviewAssignment ({ shift, assignment, event, isAdminView, isCheckedIn }: Props) {
  const radioFrequency = useMemo(() =>
    assignment?.radioFrequency || event?.radioFrequency || 'N/A', [assignment, event]);

  const callSign = useMemo(() =>
    shift?.callSign || assignment?.callSign || 'N/A', [assignment,  shift]);

  const assignmentLocation = useMemo(() => assignment?.assignmentLocation?.fullAddress || 'N/A', [assignment]);
  const assignmentLocationPin = useMemo(() => [
    assignment?.assignmentLocation?.location?.longitude || null,
    assignment?.assignmentLocation?.location?.latitude || null,
  ].filter(Boolean), [assignment]);

  const reportingArea = useMemo(() => [assignment?.assignmentArea || []], [assignment]);

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
          (isCheckedIn || isAdminView) && (
            <>
              <ShiftOverviewDetail label='Branch' value={assignment?.branch?.name} tag xs={12} md={4} xl={4} />
              <ShiftOverviewDetail label='Division' value={assignment?.assignmentDivision?.name} tag xs={12} md={4} xl={4} />
              <ShiftOverviewDetail label='Group' value={assignment?.assignmentGroup?.name} tag xs={12} md={4} xl={4} />
              <ShiftOverviewDetail label='Radio Frequency' value={radioFrequency} tag fullRow />
              <ShiftOverviewDetail label='Assignment Location' value={assignmentLocation} fullRow />
            </>
          )
        }
      </Grid>
      { (isCheckedIn || isAdminView) && reportingArea &&
        <Box>
          <PolygonDrawMap initialPin={assignmentLocationPin.length === 2 ? assignmentLocationPin : undefined as any} initialPolygons={reportingArea as any} disabled />
        </Box>
      }
      {
        assignmentLocationPin.length === 2 && (
          <ShiftOverviewDetail label="Directions" fullRow>
            <Stack direction="row" spacing={1}>
              <Button
                href={`https://maps.apple.com/?daddr=${assignmentLocationPin?.[1]},${assignmentLocationPin?.[0]}&dirflg=d`}
                target='_blank'
                startIcon={<Iconify icon="cib:apple" />}
                variant='contained'
                size='small'
              >
                Apple Maps
              </Button>
              <Button
                href={`https://www.google.com/maps/dir/?api=1&travelmode=driving&layer=traffic&destination=${assignmentLocationPin?.[1]},${assignmentLocationPin?.[0]}`}
                target='_blank'
                startIcon={<Iconify icon="cib:google" />}
                variant='contained'
                size='small'
              >
                Google Maps
              </Button>
            </Stack>
          </ShiftOverviewDetail>
        )
      }
      {
        (isCheckedIn || isAdminView) && (
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
