import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useSnackbar } from 'notistack';
// @mui
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
// api
import { VOID_INCIDENT_FORM, GET_INCIDENT_SUBMISSIONS, GET_SUBMITTED_INCIDENT_SUBMISSIONS } from 'src/api/incidentForm';
// components
import ConfirmDialog from 'src/components/custom-dialog/confirm-dialog';
// types
import { UseBooleanReturnType } from 'src/hooks/use-boolean';
import { IncidentForm } from 'src/__generated__/resolvers-types';

interface VoidSubmissionDialogProps {
  opener: UseBooleanReturnType<IncidentForm>;
}

export function VoidSubmissionDialog({ opener }: VoidSubmissionDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [voidReason, setVoidReason] = useState('');

  const [voidIncidentForm, { loading }] = useMutation(VOID_INCIDENT_FORM, {
    refetchQueries: [GET_INCIDENT_SUBMISSIONS, GET_SUBMITTED_INCIDENT_SUBMISSIONS],
    onCompleted: () => {
      enqueueSnackbar('Submission voided successfully', { variant: 'success' });
      setVoidReason('');
      opener.onFalse();
    },
    onError: (error) => {
      console.error('Failed to void submission:', error);
      enqueueSnackbar(error.message || 'Failed to void submission', { variant: 'error' });
    },
  });

  const handleVoid = async () => {
    if (!opener.attribute?.id) {
      enqueueSnackbar('No submission selected', { variant: 'error' });
      return;
    }

    try {
      await voidIncidentForm({
        variables: {
          id: opener.attribute.id,
          voidReason: voidReason.trim() || undefined,
        },
      });
    } catch (error) {
      // Error handled by onError callback
    }
  };

  const handleClose = () => {
    setVoidReason('');
    opener.onFalse();
  };

  return (
    <ConfirmDialog
      open={opener.value}
      onClose={handleClose}
      maxWidth="sm"
      title="Void Submission"
      content={
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Void Reason (Optional)"
          value={voidReason}
          onChange={(e) => setVoidReason(e.target.value)}
          placeholder="Enter reason for voiding this submission..."
          sx={{ mt: 2 }}
        />
      }
      action={
        <>
          <LoadingButton variant="contained" color="error" onClick={handleVoid} loading={loading}>
            Void Submission
          </LoadingButton>
          <Button variant="outlined" color="inherit" onClick={handleClose}>
            Cancel
          </Button>
        </>
      }
      hasCancel={false}
    />
  );
}
