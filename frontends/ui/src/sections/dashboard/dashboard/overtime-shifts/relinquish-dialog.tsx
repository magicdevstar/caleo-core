import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
import { useSnackbar } from "notistack";
import get from 'lodash/get';
// @mui
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';
// types
import { Shift, ShiftBufferRequest } from 'src/__generated__/resolvers-types';
import {
  ASSIGN_SHIFT,
  GET_ALL_SHIFTS,
  GET_SHIFT_BUFFER_REQUESTS,
  REMOVE_SHIFT_BUFFER_REQUEST,
} from 'src/api/shifts';
import { ConfirmDialog } from 'src/components/custom-dialog';

type RelinquishDialogProps = {
  open: boolean;
  editShift: Shift | ShiftBufferRequest | null;
  relinquishNoteRequired: boolean;
  onClose: VoidFunction;
};

export default function RelinquishDialog({
  open,
  editShift,
  relinquishNoteRequired = false,
  onClose,
}: RelinquishDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [relinquishNote, setRelinquishNote] = useState<string | undefined>();

  const [assignShift, { loading: relinquishLoading }] = useMutation(ASSIGN_SHIFT, {
    refetchQueries: [GET_ALL_SHIFTS],
  });
  const [removeShiftBuffer, { loading: removeShiftBufferLoading }] = useMutation(
    REMOVE_SHIFT_BUFFER_REQUEST,
    {
      refetchQueries: [GET_SHIFT_BUFFER_REQUESTS],
    }
  );

  const relinquishSubmitEnabled = useMemo(() => {
    if (editShift?.__typename === 'ShiftBufferRequest') return true;
    if (!relinquishNoteRequired) return true;
    const validNote = relinquishNote && relinquishNote.trim() !== '';
    return validNote;
  }, [editShift, relinquishNote, relinquishNoteRequired]);

  const closeDialog = useCallback(() => {
    setRelinquishNote(undefined);
    onClose();
  }, [setRelinquishNote, onClose]);

  const handleRelinquish = useCallback(async () => {
    try {
      if (editShift?.__typename === 'ShiftBufferRequest') {
        await removeShiftBuffer({
          variables: {
            id: editShift?.id,
          },
        });
      } else {
        await assignShift({
          variables: {
            id: editShift?.id,
            note: relinquishNote,
          },
        });
      }
      closeDialog();
    } catch (error) {
      enqueueSnackbar({
        variant: 'error',
        message: get(error, 'message', 'An error occurred while relinquishing the shift.'),
        autoHideDuration: 5000,
      });
    }
  }, [
    editShift,
    relinquishNote,
    assignShift,
    closeDialog,
    removeShiftBuffer,
    enqueueSnackbar,
  ]);

  return (
    <ConfirmDialog
      open={open}
      onClose={closeDialog}
      title="Relinquish Overtime"
      content={
        <>
          <Typography variant="body2">
            {editShift?.__typename === 'ShiftBufferRequest'
              ? 'Are you sure you want to remove this buffer request?'
              : 'Are you sure you want to relinquish this overtime?'}
          </Typography>
          {editShift?.__typename !== 'ShiftBufferRequest' && (
            <TextField
              fullWidth
              multiline
              rows={4}
              sx={{ mt: 2 }}
              label="Explain why you would like to relinquish this overtime"
              value={relinquishNote}
              helperText={relinquishNoteRequired ? 'This field is required' : undefined}
              onChange={(e: any) => setRelinquishNote(e.target.value)}
            />
          )}
        </>
      }
      action={
        <LoadingButton
          disabled={!relinquishSubmitEnabled}
          loading={relinquishLoading || removeShiftBufferLoading}
          variant="contained"
          color="error"
          onClick={handleRelinquish}
        >
          {editShift?.__typename === 'ShiftBufferRequest'
            ? 'Remove Buffer Request'
            : 'Relinquish Overtime'}
        </LoadingButton>
      }
    />
  );
}
