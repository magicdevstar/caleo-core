import { useCallback, useState } from 'react';
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
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
import { client } from 'src/utils/apollo';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
// types
import { Shift } from 'src/__generated__/resolvers-types';
// components
import { useSnackbar } from 'src/components/snackbar';
import { RouterLink } from 'src/routes/components';
import { GET_ALL_EVENTS, GET_EVENT } from 'src/api/event';
import { GET_ASSIGNMENT } from 'src/api/assignment';
import { ASSIGN_SHIFT, GET_ALL_SHIFTS, GET_GROUPED_SHIFTS, REMOVE_SHIFT, UPSERT_SHIFTS } from 'src/api/shifts';
import { TableConfig } from 'src/components/table/table-config';
import GQLTable from 'src/components/table/gql/table';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import { AssignShiftModal } from './assign-shift';

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
  const [editShiftId, setEditShiftId] = useState<string | null>();
  const deleteConfirm = useBoolean();
  const unassignConfirm = useBoolean();
  const assignConfirm = useBoolean();

  const [upsertShifts, { loading: isSubmitting }] = useMutation(UPSERT_SHIFTS, {
    refetchQueries: [{
      query: GET_EVENT,
      variables: {
        id: eventId,
      }
    }, {
      query: GET_ASSIGNMENT,
      variables: {
        id: assignmentId,
      }
    }, GET_GROUPED_SHIFTS],
  });

  const [removeShift, { loading: isRemoving }] = useMutation(REMOVE_SHIFT, {
    refetchQueries: [
      GET_ALL_EVENTS,
      {
        query: GET_EVENT,
        variables: {
          id: eventId,
        },
      },
      {
        query: GET_ASSIGNMENT,
        variables: {
          id: assignmentId,
        },
      },
      GET_GROUPED_SHIFTS,
    ],
  });

  const [assignShift, { loading: isAssigningShift }] = useMutation(ASSIGN_SHIFT, {
    refetchQueries: [
      GET_ALL_EVENTS,
      {
        query: GET_EVENT,
        variables: {
          id: eventId,
        },
      },
      {
        query: GET_ASSIGNMENT,
        variables: {
          id: assignmentId,
        },
      },
      GET_GROUPED_SHIFTS,
    ],
  });

  const [startTime, setStartTime] = useState<Date | null>(currentShifts?.[0]?.startTime ? new Date(currentShifts[0].startTime) : null);
  const [endTime, setEndTime] = useState<Date | null>(currentShifts?.[0]?.endTime ? new Date(currentShifts[0].endTime) : null);

  const mdUp = useResponsive('up', 'md');

  const { enqueueSnackbar } = useSnackbar();

  const openRemoveShift = useCallback((id: string) => {
    setEditShiftId(id);
    deleteConfirm.onTrue();
  }, [deleteConfirm, setEditShiftId]);

  const handleRemoveShift = useCallback(async () => {
    await removeShift({
      variables: {
        id: editShiftId,
      },
    });
    setEditShiftId(null);
    deleteConfirm.onFalse();
  }, [removeShift, setEditShiftId, editShiftId, deleteConfirm]);

  const handleShiftAssignment = useCallback(async (userId?: string) => {
    try {
      await assignShift({
        variables: {
          id: editShiftId,
          userId,
        },
      });
      setEditShiftId(null);
      unassignConfirm.onFalse();
      assignConfirm.onFalse();
    } catch(error) {
      if (/This shift if no longer available for this user/.test(error.message)) {
        enqueueSnackbar('This shift is no longer available. Please try selecting another shift.', { variant: 'error' });
        setEditShiftId(null);
        unassignConfirm.onFalse();
        assignConfirm.onFalse();
        await client.refetchQueries({
          include: [GET_GROUPED_SHIFTS]
        });
      } else {
        enqueueSnackbar('Something went wrong assigning this shift. Pleas try again.', { variant: 'error' });
      }
    }
  }, [unassignConfirm, assignConfirm, editShiftId, setEditShiftId, assignShift, enqueueSnackbar]);

  const config: TableConfig<Shift> = {
    header: {
      title: 'Shifts Slots',
      button: {
        text: 'Add Shift Slot',
        icon: 'ic:baseline-add',
        loading: isSubmitting,
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
      sx: {
        minWidth: 'inherit',
      },
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
          setEditShiftId(row.id);
          if (row.user) {
            unassignConfirm.onTrue();
          } else {
            assignConfirm.onTrue();
          }
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (row: Shift) => {
          openRemoveShift(row.id);
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
                        status: shift.status,
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
                        id: shift.id,
                        shiftId: shift.shiftId,
                        eventId: shift.event.id,
                        status: shift.status,
                        assignmentId: shift.assignment.id,
                        startTime: shift.startTime,
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
          href={paths.dashboard.admin.overtime.eventAssignmentDetail
            .replace(':eventId', eventId!)
            .replace(':assignmentId', assignmentId!)}
        >Cancel</Button>
        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          sx={{ ml: 2 }}
          onClick={() => enqueueSnackbar({ message: 'Shifts saved', variant: 'success' })}
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

      <ConfirmDialog
        open={deleteConfirm.value}
        onClose={deleteConfirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <LoadingButton variant="contained" color="error" onClick={handleRemoveShift} loading={isRemoving}>
            Delete
          </LoadingButton>
        }
      />

      <ConfirmDialog
        open={unassignConfirm.value}
        onClose={unassignConfirm.onFalse}
        title="Unassign shift slot"
        content="Are you sure want to unassign this shift slot?"
        action={
          <LoadingButton variant="contained" color="error" onClick={() => handleShiftAssignment()} loading={isAssigningShift}>
            Unassign
          </LoadingButton>
        }
      />

      <AssignShiftModal
        shiftId={editShiftId}
        assignConfirm={assignConfirm}
        assignLoading={isAssigningShift}
        assignShift={handleShiftAssignment}
      />
    </Grid>
  );
}
