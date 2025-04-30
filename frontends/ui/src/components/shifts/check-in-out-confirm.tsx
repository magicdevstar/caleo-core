import { useCallback, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useSnackbar } from 'notistack';
import { useMutation } from '@apollo/client';
import { DesktopDateTimePicker } from '@mui/x-date-pickers/DesktopDateTimePicker';
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
import { useAuthContext } from 'src/auth/hooks';
import { getNow } from 'src/hooks/use-datejs';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function CheckInOutConfirm({
  checkInOutConfirm,
  confirm,
  onSuccess,
}: {
  checkInOutConfirm: Shift | null;
  confirm: UseBooleanReturnType<unknown>;
  onSuccess?: (type: CHECK_IN_OUT_STATUS) => void;
}) {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const now = getNow({ organization: user.member.org! });
  const requiredEquipmentTime = useMemo(() => checkInOutConfirm?.assignment?.requiredEquipment?.some?.((equipment) => equipment?.requiresEquipmentTime), [checkInOutConfirm]);
  const isCheckout = useMemo(() => checkInOutConfirm?.shiftCheckInOut?.checkInTime, [checkInOutConfirm]);
  const [equipmentTime, setEquipmentTime] = useState<Dayjs | null>(checkInOutConfirm?.assignment?.requiredEquipment?.some?.((equipment) => equipment?.requiresEquipmentTime) ? dayjs() : null);
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
      if (requiredEquipmentTime && !equipmentTime) {
        enqueueSnackbar('Please select an equipment time.', { variant: 'warning' });
        return;
      }
      if (isCheckout && now.isAfter(equipmentTime)) {
        enqueueSnackbar('Equipment return time must be in the future.', { variant: 'warning' });
        return;
      }
      if (!isCheckout && now.isBefore(equipmentTime)) {
        enqueueSnackbar('Equipment pickup time must be in the past.', { variant: 'warning' });
        return;
      }
      setLoading(true);
      const location = await getLocation();
      const action = isCheckout ? checkOut : checkIn;
      const response = await action({
        variables: {
          input: {
            id: shift.id,
            note: checkInOutNote,
            signNow,
            ...(requiredEquipmentTime && equipmentTime && {
              equipmentDateTime: equipmentTime.toISOString(),
            }),
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
      setEquipmentTime(null);
      setCheckInOutNote('');
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
    setEquipmentTime,
    now,
    requiredEquipmentTime,
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
            requiredEquipmentTime && (
              <DesktopDateTimePicker
                timezone={user.member.org?.timezone}
                ampm={false}
                maxDate={dayjs()}
                timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                label={isCheckout ? 'Equipment return time' : 'Equipment pickup time'}
                value={dayjs(equipmentTime)}
                onChange={(newValue) => {
                  setEquipmentTime(newValue);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal',
                    helperText: isCheckout ?
                      'What time do you anticipate dropping off your equipment?' :
                      'What time did you pick up your equipment?',
                  },
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
