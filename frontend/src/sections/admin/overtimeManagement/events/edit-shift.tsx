import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { v4 as uuid } from 'uuid';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
// types
import { Shift } from 'src/__generated__/resolvers-types';
// components
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { RouterLink } from 'src/routes/components';
import { GET_EVENT } from 'src/api/event';
import { GET_ASSIGNMENT } from 'src/api/assignment';
import { GET_ALL_SHIFTS, GET_GROUPED_SHIFTS, UPSERT_SHIFTS } from 'src/api/shifts';
import { TableConfig } from 'src/components/table/table-config';
import GQLTable from 'src/components/table/gql/table';

// ----------------------------------------------------------------------

type Props = {
  eventId: string;
  assignmentId: string;
  currentShifts: Shift[];
  shiftId?: string;
};

export default function EditShift({
  eventId,
  assignmentId,
  currentShifts,
  shiftId,
}: Props) {
  const router = useRouter();

  const [upsertShifts, { loading: isSubmitting }] = useMutation(UPSERT_SHIFTS, {
    refetchQueries: [GET_EVENT, GET_ASSIGNMENT, GET_GROUPED_SHIFTS],
  });

  const [startTime, setStartTime] = useState<Date | null>(currentShifts?.[0]?.startTime ? new Date(currentShifts[0].startTime) : null);
  const [endTime, setEndTime] = useState<Date | null>(currentShifts?.[0]?.endTime ? new Date(currentShifts[0].endTime) : null);

  const mdUp = useResponsive('up', 'md');

  const { enqueueSnackbar } = useSnackbar();

  const config: TableConfig<Shift> = {
    header: {
      title: 'Shifts',
      button: {
        text: 'Add Shift',
        icon: 'ic:baseline-add',
        disabled: !startTime || !endTime,
        onClick: async () => {
          const groupId = shiftId || uuid();
          await upsertShifts({
            variables: {
              input: [
                {
                  startTime: startTime?.toISOString(),
                  endTime: endTime?.toISOString(),
                  assignmentId,
                  eventId,
                  shiftId: groupId,
                }
              ],
            }
          });
          if (!shiftId) {
            router.push(
              paths.dashboard.admin.overtime.eventAssignmentShiftsDetail
              .replace(':eventId', eventId!)
              .replace(':assignmentId', assignmentId!)
              .replace(':shiftId', groupId)
            );
          }
        }
      }
    },
    table: {
      minWidth: 'inherit',
    },
    search: {
      data: currentShifts || [],
      query: GET_ALL_SHIFTS,
      processResult: (data: any) => ({
        total: data.length,
        items: data,
      }),
    },
    rowActions: [
      {
        getName: (row: Shift) => row.user ? 'Unassign' : 'Assign',
        getIcon: () => 'solar:pen-bold',
        onClick: (row: Shift) => {

        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (row: Shift) => {
          
        },
      }
    ],
    columns: [
      {
        id: 'number',
        label: 'Title',
        columnType: 'string',
        renderValue: (row, index) => `# ${index + 1}`,
        width: '10%',
      },
      { id: 'user.name', width: '30%', label: 'Name', columnType: 'string' },
      { id: 'user.member.contactInfo.primaryPhone.number', width: '25%', label: 'Phone', columnType: 'string' },
      { id: 'user.member.pNumber', label: 'P #', columnType: 'string', width: '25%' },
      { id: '', width: '10%', columnType: 'action', label: '' },
    ],
    filters: []
  };

  const renderDetails = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Shift time
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Set the start and end time for the shift
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Details" />}

          <Stack direction="row" spacing={3} sx={{ p: 3 }}>
            <DateTimePicker
              label="Start time"
              maxDate={endTime}
              value={startTime}
              onChange={async (newValue: any) => {
                setStartTime(newValue);
                if (currentShifts.length > 0) {
                  await upsertShifts({
                    variables: {
                      input: currentShifts.map((shift) => ({
                        id: shift.id,
                        shiftId: shift.shiftId,
                        eventId: shift.event.id,
                        assignmentId: shift.assignment.id,
                        endTime: shift.endTime,
                        startTime: newValue.toISOString(),
                      })),
                    }
                  })
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                },
              }}
            />
            <DateTimePicker
              label="End time"
              minDate={startTime}
              value={endTime}
              onChange={async (newValue: any) => {
                setEndTime(newValue);
                if (currentShifts.length > 0) {
                  await upsertShifts({
                    variables: {
                      input: currentShifts.map((shift) => ({
                        ...shift,
                        endTime: newValue.toISOString(),
                      })),
                    }
                  })
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                },
              }}
            />
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderShifts = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Shift slots
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Add the number of slots you need for this shift
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Shift slots" />}

          <GQLTable config={config} />
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
          href={paths.dashboard.admin.overtime.eventDetail.replace(':eventId', eventId)}
        >Cancel</Button>
        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          sx={{ ml: 2 }}
        >
          {!currentShifts ? 'Create Shifts' : 'Save Changes'}
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <Grid container spacing={3}>
      {renderDetails}

      {renderShifts}

      {renderActions}
    </Grid>
  );
}
