import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
// @mui
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
// hooks
import { useWeeklyShifts } from 'src/hooks/use-weekly-shift-count';
import { useSnackbar } from 'src/components/snackbar';
// types
import { MemberRole, Shift } from 'src/__generated__/resolvers-types';
import {
  ASSIGN_SHIFT,
  CREATE_SHIFT_BUFFER,
  GET_ALL_SHIFTS,
  GET_AVAILABLE_SHIFTS,
} from 'src/api/shifts';
import { FrontendUser } from 'src/api/user';
import { client } from 'src/utils/apollo';
// components
import { ConfirmDialog } from 'src/components/custom-dialog';
import { convertDate, dateTimeFormat } from 'src/hooks/use-datejs';

type SignUpDialogProps = {
  open: boolean;
  onClose: VoidFunction;
  editShift: Shift;
  user: FrontendUser;
};

export default function SignUpDialog({ open, onClose, editShift, user }: SignUpDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [note, setNote] = useState<string>('');

  const canConfirm = useMemo(
    () => !editShift?.shiftBufferShift || (editShift?.shiftBufferShift && note.trim() !== ''),
    [editShift, note]
  );
  const isAdmin = useMemo(() => user?.member?.role === MemberRole.Admin, [user]);

  const [assignShift, { loading: assignLoading }] = useMutation(ASSIGN_SHIFT);
  const [createShiftBuffer, { loading: createShiftBufferLoading }] =
    useMutation(CREATE_SHIFT_BUFFER);

  const {
    weeklyShifts,
    loading: loadingWeeklyShifts,
    error: weeklyShiftsError,
  } = useWeeklyShifts({
    userId: user?.id,
    date: editShift?.startTime,
    skip: !isAdmin,
  });

  const closeDialog = useCallback(() => {
    setNote('');
    onClose();
  }, [onClose]);

  const handleAssign = useCallback(async () => {
    try {
      if (editShift?.shiftBufferShift) {
        await createShiftBuffer({
          variables: {
            input: {
              shiftId: editShift.id,
              shiftBufferShiftId: editShift.shiftBufferShift.id,
              userId: user?.id,
              note,
            },
          },
        });
      } else {
        await assignShift({
          variables: {
            id: editShift?.id,
            userId: user?.id,
          },
        });
      }

      client.refetchQueries({
        include: [GET_ALL_SHIFTS, GET_AVAILABLE_SHIFTS],
      });

      enqueueSnackbar(
        `You successfully signed up for ${editShift?.event?.name} - ${editShift?.assignment?.name}.`,
        { variant: 'success' }
      );
      closeDialog();
    } catch (error) {
      if (/This shift has an overlapping time/.test(error.message)) {
        enqueueSnackbar(
          'This shift overlaps with another shift. Please try selecting another shift.',
          { variant: 'error', autoHideDuration: 5000 }
        );
        closeDialog();
        await client.refetchQueries({
          include: [GET_AVAILABLE_SHIFTS],
        });
      } else if (/This shift requires a shift buffer request/.test(error.message)) {
        enqueueSnackbar('This shift requires a buffer request. Please try again.', {
          variant: 'error',
          autoHideDuration: 5000,
        });
        closeDialog();
        await client.refetchQueries({
          include: [GET_AVAILABLE_SHIFTS],
        });
      } else if (/The user has reached their maximum shifts for that week/.test(error.message)) {
        enqueueSnackbar('You have reached your maximum number of shifts for that week.', {
          variant: 'error',
          autoHideDuration: 5000,
        });
        closeDialog();
        await client.refetchQueries({
          include: [GET_AVAILABLE_SHIFTS],
        });
      } else if (/Shift already assigned/.test(error.message)) {
        enqueueSnackbar('This shift is no longer available. Please try selecting another shift.', {
          variant: 'error',
          autoHideDuration: 5000,
        });
        closeDialog();
        await client.refetchQueries({
          include: [GET_AVAILABLE_SHIFTS],
        });
      } else {
        enqueueSnackbar('Something went wrong assigning this shift. Please try again.', {
          variant: 'error',
        });
      }
    }
  }, [editShift, user?.id, note, assignShift, createShiftBuffer, closeDialog, enqueueSnackbar]);

  return (
    <ConfirmDialog
      open={open}
      onClose={closeDialog}
      title="Sign Up for Overtime"
      content={
        <>
          {editShift?.shiftBufferShift ? (
            <>
              <Typography variant="body1">
                This shift overlaps with
                <br />
                <br />
                Event: {editShift?.shiftBufferShift?.event?.name}
                <br />
                Assignment: {editShift?.shiftBufferShift?.assignment?.name}
                <br />
                Start Time:{' '}
                {editShift?.shiftBufferShift?.startTime
                  ? convertDate({ date: editShift?.shiftBufferShift?.startTime, user }).format(
                      'MM/DD/YYYY HH:mm'
                    )
                  : 'N/A'}
                <br />
                End Time:{' '}
                {editShift?.shiftBufferShift?.endTime
                  ? convertDate({ date: editShift?.shiftBufferShift?.endTime, user }).format(
                      'MM/DD/YYYY HH:mm'
                    )
                  : 'N/A'}
                <br />
                <br />
                You must submit a reason you are able to work this shift.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Reason"
                type="text"
                autoFocus
                value={note}
                sx={{ mt: 2 }}
                onChange={(event) => {
                  setNote(event.target.value);
                }}
              />
            </>
          ) : (
            <Typography variant="body1">
              Are you sure you want to sign up for <br />
              <strong>{editShift?.event?.name}</strong> -{' '}
              <strong>{editShift?.assignment?.name}</strong>
              <br />
              <strong>
                {editShift?.startTime
                  ? convertDate({
                      date: editShift?.startTime || new Date().toISOString(),
                      user,
                    }).format(dateTimeFormat)
                  : 'N/A'}
                ?
              </strong>
            </Typography>
          )}
          {isAdmin &&
            (weeklyShifts?.length || 0) >=
              (user?.member?.maxShifts ||
                user?.member?.org?.settings?.shiftsPerWeek ||
                Number.POSITIVE_INFINITY) &&
            !weeklyShiftsError &&
            !loadingWeeklyShifts && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
                Warning: You have reached your max shift limit for this shift week.
              </Typography>
            )}
          {weeklyShiftsError && !loadingWeeklyShifts && (
            <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
              Error retrieving weekly shift count. Shift count for this shift week is unknown.
              Proceed with Caution.
            </Typography>
          )}
        </>
      }
      action={
        <LoadingButton
          loading={assignLoading || createShiftBufferLoading || loadingWeeklyShifts}
          disabled={!canConfirm}
          variant="contained"
          color="primary"
          onClick={handleAssign}
        >
          Sign up for overtime
        </LoadingButton>
      }
    />
  );
}
