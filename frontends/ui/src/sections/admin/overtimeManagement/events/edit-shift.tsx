import { useCallback, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useMutation } from '@apollo/client';
import { v4 as uuid } from 'uuid';
import PhoneNumberFormatter from 'phone-number-formats';
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
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
import { client } from 'src/utils/apollo';
import { useFeatures } from 'src/hooks/use-features';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
// types
import { EventStatus, Shift, ShiftInterestRequest } from 'src/__generated__/resolvers-types';
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
  UPDATE_SHIFTS,
  UPSERT_SHIFTS
} from 'src/api/shifts';
import { TableConfig } from 'src/components/table/table-config';
import GQLTable from 'src/components/table/gql/table';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import { useAuthContext } from 'src/auth/hooks';
import Iconify from 'src/components/iconify';
import DropDownButton from 'src/components/dropdown-button/dropdown-button';
import { EditCheckInOut } from 'src/components/shifts/edit-check-in-out';
import { InterestList } from 'src/components/interest-list/interest-list';
import { convertDate, dateTimeFormat } from 'src/hooks/use-datejs';
import { usePNumberLabel } from 'src/hooks/use-pNumber-label';
import { AssignShiftModal } from './assign-shift';

// ----------------------------------------------------------------------

type Props = {
  eventId: string;
  assignmentId: string;
  currentShifts: Shift[];
  backLink: string;
  shiftId?: string;
  shiftInterestRequests?: ShiftInterestRequest[];
};

dayjs.extend(utc);
dayjs.extend(timezone);

export default function EditShift({
  eventId,
  assignmentId,
  currentShifts,
  shiftInterestRequests,
  backLink,
  shiftId,
}: Props) {
  const router = useRouter();
  const { user } = useAuthContext();
  const { pNumberLabel } = usePNumberLabel();
  const { eventCheckIn, interestLists } = useFeatures();
  const [editShiftId, setEditShiftId] = useState<string | null>();
  const editCheckInOutModal = useBoolean();
  const deleteConfirm = useBoolean();
  const createSlotsConfirm = useBoolean();
  const createSlotsLoading = useBoolean();
  const unassignConfirm = useBoolean();
  const assignConfirm = useBoolean();
  const lockConfirm = useBoolean();
  const showInterestList = useBoolean();
  const [shiftsToCreate, setShiftsToCreate] = useState<number>(1);
  const [editCheckInOut, setEditCheckInOut] = useState<Shift | null>();
  const [unassignReason, setUnassignReason] = useState<string>('');
  const [lockShift, setLockShift] = useState<Shift | null>();
  const canNotify = useMemo(() =>
    currentShifts?.[0]?.event?.status === EventStatus.FirstComeFirstServe &&
    currentShifts.some((shift) => shift.userId === null || !('userId' in shift)),
  [currentShifts]);
  const allDisabled = useMemo(() => {
    const hasInvalidStatus = [EventStatus.Complete, EventStatus.Removed].includes(currentShifts?.[0]?.event?.status || '' as any);
    const isRemoved = currentShifts?.[0]?.assignment?.removedAt || currentShifts?.[0]?.event?.removedAt;
    return Boolean(hasInvalidStatus || isRemoved);
  }, [currentShifts]);
  const isComplete = useMemo(() => {
    const completeStatus = currentShifts?.[0]?.event?.status === EventStatus.Complete;
    const completeEndTime = currentShifts?.[0]?.event?.endTime ? Date.now() >= new Date(currentShifts[0].event.endTime).valueOf() : false;
    return completeStatus || completeEndTime;
  }, [currentShifts]);

  const [notify] = useMutation(NOTIFY_OF_SHIFT, {
    variables: {
      shiftId: currentShifts?.[0]?.shiftId,
    },
    onCompleted() {
      enqueueSnackbar('All available officers will be notified shortly!', { variant: 'success' });
    },
  });

  const [updateShifts, { loading: isSubmittingUpdates }] = useMutation(UPDATE_SHIFTS, {
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

  const [upsertShifts, { loading: isSubmittingUpserts }] = useMutation(UPSERT_SHIFTS, {
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

  const isSubmitting = useMemo(() =>
    isSubmittingUpdates || isSubmittingUpserts,
  [isSubmittingUpdates, isSubmittingUpserts]);

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

  const [startTime, setStartTime] = useState<Date | null>(
    currentShifts?.[0]?.startTime
      ? new Date(currentShifts[0].startTime)
      : dayjs().startOf('hour').toDate()
  );
  const [endTime, setEndTime] = useState<Date | null>(
    currentShifts?.[0]?.endTime
      ? new Date(currentShifts[0].endTime)
      : dayjs().startOf('hour').add(1, 'hour').toDate()
  );

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
          note: unassignReason,
        },
      });
      setEditShiftId(null);
      setUnassignReason('');
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
        enqueueSnackbar('Something went wrong assigning this shift. Please try again.', { variant: 'error' });
      }
    }
  }, [
    unassignConfirm,
    assignConfirm,
    editShiftId,
    unassignReason,
    setUnassignReason,
    setEditShiftId,
    assignShift,
    enqueueSnackbar
  ]);

  const handleBulkShiftCreate = useCallback(async () => {
    const groupId = shiftId || uuid();
    await upsertShifts({
      variables: {
        input: new Array(shiftsToCreate).fill('i').map(() => ({
          startTime: startTime?.toISOString(),
          endTime: endTime?.toISOString(),
          assignmentId,
          eventId,
          shiftId: groupId,
        })),
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
    createSlotsConfirm.onFalse();
  }, [
    createSlotsConfirm,
    router,
    startTime,
    endTime,
    eventId,
    assignmentId,
    shiftId,
    shiftsToCreate,
    upsertShifts,
  ]);

  const config: TableConfig<Shift> = {
    header: {
      title: `Shifts Slots (${(currentShifts || []).length})`,
      buttons: [
        ...(interestLists ? [{
          key: 'showInterestList',
          render: (arg: any) => (
            <Tooltip key={arg.key} title="Show Interest List">
              <IconButton onClick={() => showInterestList.onTrue()} color='default'>
                <Iconify icon="ic:round-front-hand" />
              </IconButton>
            </Tooltip>
          )
        }]: []),
        {
          key: 'addShifts',
          text: 'Add Shift Slot',
          icon: 'ic:baseline-add',
          loading: isSubmitting,
          disabled: !startTime || !endTime || allDisabled || isComplete,
          render: () => (
            <DropDownButton
              text="Add shift slot"
              menuItems={[
                {
                  key: 'singleShift',
                  text: 'Add one slot',
                  onClick: () => {
                    setShiftsToCreate(1);
                    handleBulkShiftCreate();
                  },
                  icon: 'ic:round-add'
                },
                {
                  key: 'bulkShifts',
                  text: 'Bulk add slots',
                  onClick: () => {
                    setShiftsToCreate(1);
                    createSlotsConfirm.onTrue();
                  },
                  icon: 'ic:round-playlist-add'
                },
              ]}
              buttonClick={async () => {
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
              }}
            />
          ),
        },
      ]
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
        getIcon: () => 'solar:pen-bold-duotone',
        getDisabled: (row: Shift) => allDisabled || isComplete,
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
        getIcon: (row: Shift) => row.locked ? 'solar:lock-keyhole-unlocked-bold-duotone' : 'solar:lock-keyhole-bold-duotone',
        getDisabled: () => allDisabled || isComplete,
        onClick: (row: Shift) => {
          setLockShift(row);
          lockConfirm.onTrue();
        },
      },
      {
        getName: () => 'Delete',
        getDisabled: (row: Shift) => !!row.locked || allDisabled || isComplete,
        getIcon: () => 'solar:trash-bin-trash-bold-duotone',
        onClick: (row: Shift) => {
          openRemoveShift(row.id);
        },
      },
      ...(eventCheckIn ? [{
        getName: () => 'View Check In/Out',
        getDisabled: (row: Shift) => !row.shiftCheckInOut,
        getIcon: () => 'solar:stopwatch-bold-duotone',
        onClick: (row: Shift) => {
          setEditCheckInOut(row);
          editCheckInOutModal.onTrue();
        },
      }] : []),
    ].filter(Boolean) as any,
    columns: [
      {
        id: 'id',
        label: 'Locked',
        columnType: 'string',
        renderValue: (rowKey: string) => {
          const foundShift = currentShifts.find((shift) => shift.id === rowKey);
          if (!foundShift) return null;
          return (<Iconify sx={{color: foundShift.locked ? "error.main" : "default"}} icon={foundShift.locked ? 'solar:lock-keyhole-bold' : 'solar:lock-keyhole-unlocked-bold'} />);
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
      {
        id: 'user.member.contactInfo.primaryPhone.number',
        width: '25%',
        label: 'Phone',
        columnType: 'string',
        renderValue: (value) => {
          let phoneNum = value;
          if (phoneNum) {
            try {
              phoneNum = new PhoneNumberFormatter(phoneNum).format({type: 'domestic'}).string;
            } catch (e) {
              console.error(e);
            }
          }
          return phoneNum;
        }
      },
      { id: 'user.member.pNumber', label: pNumberLabel, columnType: 'string', width: '25%' },
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
              disabled={!canNotify || allDisabled || isComplete}
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
          disabled={allDisabled || !currentShifts.length}
          onClick={() => {
            // TODO: Figure out what to do with this button since currently it does nothing.
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
              disabled={allDisabled}
              minDate={isComplete ? dayjs(startTime) : undefined}
              maxDate={isComplete ? dayjs(startTime) : undefined}
              timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
              label="Start time"
              value={dayjs(startTime)}
              onChange={async (newValue: any) => {
                setStartTime(newValue);
                const afterEndTime = dayjs(endTime).isBefore(newValue);
                if(afterEndTime) {
                  setEndTime(newValue);
                }
                if (currentShifts.length > 0) {
                  await updateShifts({
                    variables: {
                      shiftId,
                      updates: {
                        endTime: afterEndTime ? newValue.toISOString() : currentShifts[0].endTime,
                        startTime: newValue.toISOString(),
                      }
                    },
                  });
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                  ...(currentShifts?.[0]?.event?.requestDetails?.startTime ? {
                    helperText: `Suggested event start time: ${convertDate({ date: currentShifts?.[0]?.event?.requestDetails?.startTime, user }).format(dateTimeFormat)}`
                  } : {}),
                },
                field: {
                  readOnly: isComplete
                }
              }}
            />
            <DateTimePicker
              label="End time"
              timezone={user.member.org?.timezone}
              ampm={false}
              disabled={allDisabled}
              timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
              value={dayjs(endTime)}
              minDate={isComplete ? dayjs(endTime) : dayjs(startTime)}
              maxDate={isComplete ? dayjs(endTime) : undefined}
              onChange={async (newValue: any) => {
                setEndTime(newValue);
                const beforeStartTime = dayjs(startTime).isAfter(newValue);
                if(beforeStartTime) {
                  setStartTime(newValue);
                }
                if (currentShifts.length > 0) {
                  await updateShifts({
                    variables: {
                      shiftId,
                      updates: {
                        startTime: beforeStartTime ? newValue.toISOString() : currentShifts[0].startTime,
                        endTime: newValue.toISOString(),
                      }
                    },
                  });
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                  ...(currentShifts?.[0]?.event?.requestDetails?.endTime ? {
                    helperText: `Suggested event end time: ${convertDate({ date: currentShifts?.[0]?.event?.requestDetails?.endTime, user }).format(dateTimeFormat)}`
                  } : {}),
                },
                field: {
                  readOnly: isComplete
                }
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
        open={createSlotsConfirm.value}
        onClose={createSlotsConfirm.onFalse}
        title="Bulk Create Shift Slots"
        content={(
          <Stack spacing={2}>
            <Typography variant='body1'>Are you sure want to create shift slots for the selected time range?</Typography>
            <TextField value={shiftsToCreate} onChange={(e) => setShiftsToCreate(parseInt(e.target.value, 10))} label="Number of slots" type="number" variant="outlined" />
          </Stack>
        )}
        action={
          <LoadingButton variant="contained" color="primary" onClick={handleBulkShiftCreate} loading={createSlotsLoading.value}>
            Create Slots
          </LoadingButton>
        }
      />

      <ConfirmDialog
        open={unassignConfirm.value}
        onClose={unassignConfirm.onFalse}
        title="Unassign shift slot"
        content={(
          <Stack direction="column" spacing={2}>
            <Typography variant='body1'>Are you sure want to unassign this shift slot?</Typography>
            <TextField
              label="Reason"
              multiline
              rows={4}
              variant="outlined"
              value={unassignReason}
              onChange={(e) => setUnassignReason(e.target.value)}
            />
          </Stack>
        )}
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

      <InterestList open={showInterestList} interestList={shiftInterestRequests || []} />

      <EditCheckInOut
        shift={editCheckInOut!}
        editCheckInOutModal={editCheckInOutModal}
        handleClose={() => {
          editCheckInOutModal.onFalse();
          setTimeout(() => {
            setEditCheckInOut(null);
          }, 200);
        }}
      />
      <AssignShiftModal
        shiftId={editShiftId}
        shiftStartTime={currentShifts?.[0]?.startTime}
        orgMaxShifts={user?.member?.org?.settings?.shiftsPerWeek}
        existingUserIds={existingUserIds}
        assignConfirm={assignConfirm}
        assignLoading={isAssigningShift}
        assignShift={handleShiftAssignment}
      />
    </Grid>
  );
}
