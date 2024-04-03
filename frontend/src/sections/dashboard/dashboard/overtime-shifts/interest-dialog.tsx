import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client';
// @mui
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
// hooks
import { useWeeklyShifts } from 'src/hooks/use-weekly-shift-count';
import { useSnackbar } from 'src/components/snackbar';
// types
import { Shift } from 'src/__generated__/resolvers-types';
import {
  GET_ALL_SHIFTS,
  GET_AVAILABLE_SHIFTS,
  REMOVE_SHIFT_INTEREST_REQUEST,
  SHIFT_INTEREST_REQUEST,
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

export default function InterestDialog({
  open,
  onClose,
  editShift,
  user
}: SignUpDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const existingInterest = editShift?.shiftInterestRequest?.id;

  const [interestRequest] = useMutation(SHIFT_INTEREST_REQUEST);
  const [removeInterestRequest] = useMutation(REMOVE_SHIFT_INTEREST_REQUEST);

  const {
    loading: loadingWeeklyShifts,
    error: weeklyShiftsError,
  } = useWeeklyShifts({
    userId: user?.id,
    date: editShift?.startTime,
  });

  const closeDialog = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleAssign = useCallback(async () => {
    try {
      setLoading(true);
      let message = `Your interest has been submitted for ${editShift?.event?.name} - ${editShift?.assignment?.name}.`;
      if (existingInterest) {
        message = `Your interest has been removed for ${editShift?.event?.name} - ${editShift?.assignment?.name}.`;
        await removeInterestRequest({
          variables: {
            id: editShift?.shiftInterestRequest?.id,
          }
        });
      } else {
        await interestRequest({
          variables: {
            shiftInterestRequest: {
              ...(editShift?.shiftInterestRequest?.id && { id: editShift?.shiftInterestRequest?.id }),
              shiftGroupId: editShift?.shiftId,
              userId: user?.id,
            },
          },
        });
      }

      await client.refetchQueries({
        include: [GET_ALL_SHIFTS, GET_AVAILABLE_SHIFTS],
      });

      enqueueSnackbar(
        message,
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
    } finally {
      setLoading(false);
    }
  }, [
    editShift,
    existingInterest,
    removeInterestRequest,
    interestRequest,
    user?.id,
    closeDialog,
    enqueueSnackbar
  ]);

  return (
    <ConfirmDialog
      open={open}
      onClose={closeDialog}
      title={existingInterest ? "Remove Interest" : "Show Interest"}
      content={
        <>
          <Typography variant="body1">Are you sure you {existingInterest ? "remove interest" : "are interested"} in </Typography>
          <Typography variant="body1">
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
          {!existingInterest && editShift?.event?.scheduledCloseInterestList && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Show interest now! This interest list will close on {convertDate({ date: editShift.event.scheduledCloseInterestList, user }).format(dateTimeFormat)}.
            </Typography>
          )}
          {!existingInterest && <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            An administrator will review your request and notify you if you are selected for this event.
          </Typography>}
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
          loading={loading || loadingWeeklyShifts}
          variant="contained"
          color="primary"
          onClick={handleAssign}
        >
          {existingInterest ? "Remove Interest" : "Show Interest"}
        </LoadingButton>
      }
    />
  );
}
