import { useCallback, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useMutation } from '@apollo/client';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Shift } from 'src/__generated__/resolvers-types';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { UseBooleanReturnType } from "src/hooks/use-boolean"
import { CHECK_IN, CHECK_OUT, GET_ALL_SHIFTS } from 'src/api/shifts';
import { getLocation } from 'src/utils/get-location';
import { client } from 'src/utils/apollo';
import LoadingButton from '@mui/lab/LoadingButton';
import { CHECK_IN_OUT_STATUS } from 'src/types/checkinout';

export default function CheckInOutConfirm({
  checkInOutConfirm,
  confirm,
  onSuccess,
}: {
  checkInOutConfirm: Shift | null;
  confirm: UseBooleanReturnType;
  onSuccess?: (type: CHECK_IN_OUT_STATUS) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const isCheckout = useMemo(() => checkInOutConfirm?.shiftCheckInOut?.checkInTime, [checkInOutConfirm]);
  const [equipmentTime, setEquipmentTime] = useState<number>(0);
  const [checkInOutNote, setCheckInOutNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [signNow, setSignNow] = useState(true);

  const [checkIn] = useMutation(CHECK_IN, {
    refetchQueries: [GET_ALL_SHIFTS],
  });
  const [checkOut] = useMutation(CHECK_OUT, {
    refetchQueries: [GET_ALL_SHIFTS],
  });
  
  const handleCheckInOut = useCallback(async (shift: Shift) => {
    const actionName = isCheckout ? 'Check out' : 'Check in';
    try {
      setLoading(true);
      const location = await getLocation();
      const action = isCheckout ? checkOut : checkIn;
      const response = await action({
        variables: {
          input: {
            id: shift.id,
            note: checkInOutNote,
            equipmentTime,
            signNow,
            ...(location && {
              coords: {
                accuracy: location.coords.accuracy,
                altitude: location.coords.altitude,
                altitudeAccuracy: location.coords.altitudeAccuracy,
                heading: location.coords.heading,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                speed: location.coords.speed,
              }
            }),
          },
        }
      });

      enqueueSnackbar(`${actionName} Success!`, { variant: 'success', autoHideDuration: 2000 });

      const url = response?.data?.checkOut?.signingUrl;
      if (url) {
        window.open(url);
      }

      await client.refetchQueries({
        include: [GET_ALL_SHIFTS],
      });
      confirm.onFalse();
      onSuccess?.(isCheckout ? CHECK_IN_OUT_STATUS.CHECKED_OUT : CHECK_IN_OUT_STATUS.CHECKED_IN);
    } catch(error) {
      enqueueSnackbar(`Failed to ${actionName}. Please try again.`, { variant: 'error' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [
    checkIn,
    checkOut,
    setLoading,
    enqueueSnackbar,
    onSuccess,
    isCheckout,
    confirm,
    checkInOutNote,
    equipmentTime,
    signNow,
  ]);

  return (
    <ConfirmDialog
      open={confirm.value}
      onClose={confirm.onFalse}
      title={isCheckout ? 'Confirm checking out?' : 'Confirm checking in?'}
      content={(
        <Stack spacing={2} mt={1}>
          {
            checkInOutConfirm?.assignment?.requiredEquipment?.some?.((equipment) => equipment?.requiresEquipmentTime) && (
              <TextField
                label="Equipment time in hours"
                type="number"
                fullWidth
                onBlur={(event) => {
                  setEquipmentTime(parseFloat(event.target.value))
                }}
              />
            )
          }
          <TextField
            label="Type to add a note"
            multiline
            fullWidth
            rows={4}
            onBlur={(event) => {
              setCheckInOutNote(event.target.value)
            }}
          />
          {
            isCheckout && (
              <FormControlLabel
                control={
                  <Switch
                    onChange={(_, checked) => setSignNow(checked)}
                    checked={signNow} />
                }
                label="Sign shift document now"
              />
            )
          }
        </Stack>
      )}
      action={
        <LoadingButton loading={loading} variant="contained" onClick={() => handleCheckInOut(checkInOutConfirm!)}>
          {isCheckout ? 'Check out' : 'Check in'}
        </LoadingButton>
      }
    />
  )  
}
