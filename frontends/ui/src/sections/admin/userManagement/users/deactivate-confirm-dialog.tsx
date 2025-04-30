import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { useSnackbar } from "notistack";
import dayjs from "dayjs";
// @mui
import LoadingButton from "@mui/lab/LoadingButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TextField from "@mui/material/TextField";
// components
import { MemberStatus, User } from "src/__generated__/resolvers-types";
import { GET_USERS, UPDATE_USER } from "src/api/user";
import { ConfirmDialog } from "src/components/custom-dialog";
import { UseBooleanReturnType } from "src/hooks/use-boolean";

export default function StatusConfirmDialog({
  statusConfirm,
  status,
  user,
}: {
  status?: MemberStatus.Active | MemberStatus.Inactive;
  statusConfirm: UseBooleanReturnType<unknown>;
  user?: User;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deactivateUntil, setDeactivateUntil] = useState<dayjs.Dayjs | null>(
    user?.member?.inactivateUntil ? dayjs(new Date(user.member.inactivateUntil)) : null
  );
  const [deactivateNote, setDeactivateNote] = useState<string>(user?.member?.inactivationNote || '');
  const { enqueueSnackbar } = useSnackbar();
  const [updateUser, { loading }] = useMutation(UPDATE_USER, {
    refetchQueries: [GET_USERS],
  });
  const reactivating = MemberStatus.Active === status;
  const title = reactivating ? 'Reactivate' : 'Deactivate';
  const confirmText = reactivating ? 'Reactivate User' : 'Deactivate User';
  const contentText = reactivating ? 'Are you sure you would like to reactivate this account?' : 'Are you sure you would like to deactivate this account?';

  useEffect(() => {
    if (user?.member?.inactivateUntil) {
      setDeactivateUntil(dayjs(new Date(user.member.inactivateUntil)));
    }
    if (user?.member?.inactivationNote) {
      setDeactivateNote(user.member.inactivationNote);
    }
  }, [user, statusConfirm.value]);

  const content = (
   <Stack direction="column" spacing={3}>
    <Typography variant="body1">{contentText}</Typography>
    <DatePicker
      label="Deactivate Until"
      disabled={reactivating}
      value={deactivateUntil}
      onChange={(newValue: any) => {
        if (newValue) {
          setDeactivateUntil(newValue);
        }
      }}
      slotProps={{
        textField: {
          helperText: reactivating ? '' : 'Leave blank to deactivate indefinitely',
        },
        field: {
          clearable: true,
          onClear: () => setDeactivateUntil(null),
        },
      }}
    />
    <TextField
      label="Deactivation Reason"
      multiline
      value={deactivateNote}
      onChange={(e) => setDeactivateNote(e.target.value)}
      rows={4}
      disabled={reactivating}
      error={!!errorMessage}
      helperText={errorMessage}
    />
   </Stack>
  );

  const closeDialog = useCallback(() => {
    setDeactivateUntil(null);
    setDeactivateNote('');
    statusConfirm.onFalse();
  }, [
    statusConfirm,
    setDeactivateUntil,
    setDeactivateNote,
  ]);

  const handleConfirmation = useCallback(async () => {
    if (status === MemberStatus.Inactive && !deactivateNote) {
      setErrorMessage('Please provide a reason for deactivating this account');
      return;
    }
    try {
      await updateUser({
        variables: {
          input: {
            id: user?.id,
            firstName: user?.firstName,
            lastName: user?.lastName,
            cognitoId: user?.cognitoId,
            member: {
              orgId: user?.member?.orgId,
              pNumber: user?.member.pNumber,
              status,
              ...(deactivateUntil && {inactivateUntil: deactivateUntil?.startOf('day')?.toDate()?.toISOString()}),
              ...(deactivateNote && {inactivationNote: deactivateNote}),
            },
          },
        },
      });
      enqueueSnackbar('Successfully updated user status!', { variant: 'success', autoHideDuration: 3000 });
      closeDialog();
    } catch(error) {
      enqueueSnackbar('Failed to update user status. Please try again', { variant: 'error', autoHideDuration: 3000 });
      console.error(error);
    }
  }, [
    status,
    user,
    deactivateUntil,
    deactivateNote,
    setErrorMessage,
    updateUser,
    enqueueSnackbar,
    closeDialog,
  ]);

  return (
    <ConfirmDialog
      open={statusConfirm.value}
      onClose={closeDialog}
      title={title}
      content={content}
      action={
        <LoadingButton loading={loading} variant="contained" color={reactivating ? "info" : "error"} onClick={handleConfirmation}>
          {confirmText}
        </LoadingButton>
      }
    />
  );
}