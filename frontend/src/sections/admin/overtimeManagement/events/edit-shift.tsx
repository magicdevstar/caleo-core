import { useCallback, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
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
import Tooltip from '@mui/material/Tooltip';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
import { client } from 'src/utils/apollo';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
// types
import { EventStatus, Shift } from 'src/__generated__/resolvers-types';
// components
import { useSnackbar } from 'src/components/snackbar';
import { RouterLink } from 'src/routes/components';
import { GET_ALL_EVENTS, GET_EVENT } from 'src/api/event';
import { GET_ASSIGNMENT } from 'src/api/assignment';
import {
  ASSIGN_SHIFT,
  GET_ALL_SHIFTS,
  GET_GROUPED_SHIFTS,
  NOTIFY_OF_SHIFT,
  REMOVE_SHIFT,
  UPSERT_SHIFTS
} from 'src/api/shifts';
import { TableConfig } from 'src/components/table/table-config';
import GQLTable from 'src/components/table/gql/table';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import { useAuthContext } from 'src/auth/hooks';
import Iconify from 'src/components/iconify';
import { AssignShiftModal } from './assign-shift';

// ----------------------------------------------------------------------

type Props = {
  eventId: string;
  assignmentId: string;
  currentShifts: Shift[];
  backLink: string;
  shiftId?: string;
};

dayjs.extend(utc);
dayjs.extend(timezone);

export default function EditShift({
  eventId,
  assignmentId,
  currentShifts,
  backLink,
  shiftId,
}: Props) {
  const router = useRouter();
  const { user } = useAuthContext();
  const [editShiftId, setEditShiftId] = useState<string | null>();
  const deleteConfirm = useBoolean();
  const unassignConfirm = useBoolean();
  const assignConfirm = useBoolean();
  const lockConfirm = useBoolean();
  const [lockShift, setLockShift] = useState<Shift | null>();
  const canNotify = useMemo(() =>
    currentShifts?.[0]?.event?.status === EventStatus.FirstComeFirstServe &&
    currentShifts.some((shift) => shift.userId === null || !('userId' in shift)),
  [currentShifts]);
  const allDisabled = useMemo(() => [EventStatus.Complete, EventStatus.Removed].includes(currentShifts?.[0]?.event?.status || '' as any), [currentShifts]);

  const [notify] = useMutation(NOTIFY_OF_SHIFT, {
    variables: {
      shiftId: currentShifts?.[0]?.shiftId,
    },
    onCompleted() {
      enqueueSnackbar('All available officers will be notified shortly!', { variant: 'success' });
    },
  });

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

  const [startTime, setStartTime] = useState<Date | null>(currentShifts?.[0]?.startTime ? new Date(currentShifts[0].startTime) : new Date());
  const [endTime, setEndTime] = useState<Date | null>(currentShifts?.[0]?.endTime ? new Date(currentShifts[0].endTime) : dayjs().add(1, 'hour').toDate());

  const mdUp = useResponsive('up', 'md');
  const existingUserIds: string[] = useMemo(() => currentShifts.map((shift) => shift.user?.id).filter((id) => !!id) || [], [currentShifts]) as any;

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
      if (/This shift has an overlapping time/.test(error.message)) {
        enqueueSnackbar(error.message, { variant: 'error' });
      } else if (/This shift if no longer available for this user/.test(error.message)) {
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
        disabled: !startTime || !endTime || allDisabled,
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
        getDisabled: (row: Shift) => !!row.locked || allDisabled,
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
        getName: (row: Shift) => row.locked ? 'Unlock' : 'Lock',
        getIcon: (row: Shift) => row.locked ? 'solar:lock-keyhole-unlocked-bold' : 'solar:lock-keyhole-bold',
        getDisabled: () => allDisabled,
        onClick: (row: Shift) => {
          setLockShift(row);
          lockConfirm.onTrue();
        },
      },
      {
        getName: () => 'Delete',
        getDisabled: (row: Shift) => !!row.locked || allDisabled,
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (row: Shift) => {
          openRemoveShift(row.id);
        },
      }
    ],
    columns: [
      {
        id: 'id',
        label: 'Locked',
        columnType: 'string',
        renderValue: (rowKey: string) => {
          const foundShift = currentShifts.find((shift) => shift.id === rowKey);
          if (!foundShift) return null;
          return (<Iconify icon={foundShift.locked ? 'solar:lock-keyhole-bold' : 'solar:lock-keyhole-unlocked-bold'} />);
        },
        width: '10%',
      },
      {
        id: 'refNumber',
        label: 'Slot Ref',
        columnType: 'string',
        renderValue: (row) => `# ${row}`,
        width: '10%',
      },
      { id: 'user.name', width: '25%', label: 'Name', columnType: 'string' },
      { id: 'user.member.contactInfo.primaryPhone.number', width: '25%', label: 'Phone', columnType: 'string' },
      { id: 'user.member.pNumber', label: 'P #', columnType: 'string', width: '25%' },
      { id: '', width: '5%', columnType: 'action', label: '' },
    ],
    filters: []
  };

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
        <Tooltip title={!canNotify ? 'Event must be first come first serve and there must be available shifts' : ''}>
          <span>
            <Button
              disabled={!canNotify || allDisabled}
              variant='outlined'
              size="large"
              onClick={notify as any}
            >Notify Users of Available Shifts</Button>
          </span>
        </Tooltip>
        <Button
          component={RouterLink}
          variant='outlined'
          size="large"
          sx={{ ml: 2 }}
          href={paths.dashboard.admin.overtime.eventAssignmentDetail
            .replace(':eventId', eventId!)
            .replace(':assignmentId', assignmentId!)}
        >Cancel</Button>
        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          sx={{ ml: 2 }}
          disabled={allDisabled}
          onClick={() => {
            enqueueSnackbar({ message: 'Shifts saved', variant: 'success' })
            router.push(backLink);
          }}
        >
          {!currentShifts ? 'Create Shifts' : 'Save Changes'}
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <Grid container spacing={3}>
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
              timezone={user.member.org?.timezone}
              ampm={false}
              timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
              label="Start time"
              value={dayjs(startTime)}
              onChange={async (newValue: any) => {
                setStartTime(newValue);
                if(dayjs(endTime).isBefore(newValue)) {
                  setEndTime(newValue);
                }
                if (currentShifts.length > 0) {
                  await upsertShifts({
                    variables: {
                      input: currentShifts.map((shift) => ({
                        id: shift.id,
                        refNumber: shift.refNumber,
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
              timezone={user.member.org?.timezone}
              ampm={false}
              timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
              value={dayjs(endTime)}
              minDate={dayjs(startTime)}
              onChange={async (newValue: any) => {
                setEndTime(newValue);
                if (currentShifts.length > 0) {
                  await upsertShifts({
                    variables: {
                      input: currentShifts.map((shift) => ({
                        id: shift.id,
                        refNumber: shift.refNumber,
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

      <ConfirmDialog
        open={lockConfirm.value}
        onClose={lockConfirm.onFalse}
        title={lockShift?.locked ? "Unlock shift slot" : "Lock shift slot"}
        content={lockShift?.locked ? "Are you sure want to unlock this shift slot?" : "Are you sure want to lock this shift slot?"}
        action={
          <LoadingButton variant="contained" color="error" onClick={async () => {
            await upsertShifts({
              variables: {
                input: [
                  {
                    id: lockShift?.id,
                    refNumber: lockShift?.refNumber,
                    startTime: lockShift?.startTime,
                    endTime: lockShift?.endTime,
                    assignmentId,
                    eventId,
                    status: lockShift?.status,
                    shiftId: lockShift?.shiftId,
                    locked: !lockShift?.locked,
                  },
                ],
              }
            });
            lockConfirm.onFalse();
            setLockShift(undefined);
          }} loading={isSubmitting}>
            {lockShift?.locked ? 'Unlock' : 'Lock'}
          </LoadingButton>
        }
      />

      <AssignShiftModal
        shiftId={editShiftId}
        existingUserIds={existingUserIds}
        assignConfirm={assignConfirm}
        assignLoading={isAssigningShift}
        assignShift={handleShiftAssignment}
      />
    </Grid>
  );
}
