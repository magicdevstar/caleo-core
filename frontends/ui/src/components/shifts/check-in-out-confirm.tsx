import { useCallback, useMemo, useState } from 'react';
import { useGeolocation } from 'react-use';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useSnackbar } from 'notistack';
import { useMutation } from '@apollo/client';
import { DesktopDateTimePicker } from '@mui/x-date-pickers/DesktopDateTimePicker';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { MemberRole, Shift } from 'src/__generated__/resolvers-types';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean, UseBooleanReturnType } from "src/hooks/use-boolean"
import { CHECK_IN, CHECK_OUT, GET_ALL_SHIFTS } from 'src/api/shifts';
import { isWithinPolygon } from 'src/utils/get-location';
import { client } from 'src/utils/apollo';
import LoadingButton from '@mui/lab/LoadingButton';
import { CHECK_IN_OUT_STATUS } from 'src/types/checkinout';
import { useAuthContext } from 'src/auth/hooks';
import { getNow } from 'src/hooks/use-datejs';
import { useFeatures } from 'src/hooks/use-features';
import VehicleCategoriesSelect from '../vehicle-categories/vehicle-categories-select';
import { ShiftOverviewDialog } from './overview/shift-overview-dialog';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function CheckInOutConfirm({
  checkInOutConfirm,
  confirm,
  onSuccess,
  ignoreGeoFence,
  fromSelfCheckout,
}: {
  checkInOutConfirm: Shift | null;
  confirm: UseBooleanReturnType<any>;
  ignoreGeoFence?: boolean;
  fromSelfCheckout: boolean;
  onSuccess?: (type: CHECK_IN_OUT_STATUS) => void;
}) {
  const geoLocation = useGeolocation();
  const { eventCheckIn, docusignCheckout, vehicleCategories } = useFeatures();
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const overviewController = useBoolean<Shift>();
  const now = getNow({ organization: user.member.org! });
  const requiredEquipmentTime = useMemo(() => checkInOutConfirm?.assignment?.requiredEquipment?.some?.((equipment) => equipment?.requiresEquipmentTime), [checkInOutConfirm]);
  const requiredVehicleInformation = useMemo(() => checkInOutConfirm?.assignment?.requiredEquipment?.some?.((equipment) => equipment?.requiresVehicleInformation), [checkInOutConfirm]);
  const isCheckout = useMemo(() => checkInOutConfirm?.shiftCheckInOut?.checkInTime || !eventCheckIn, [checkInOutConfirm, eventCheckIn]);
  const [equipmentTime, setEquipmentTime] = useState<Dayjs | null>(checkInOutConfirm?.assignment?.requiredEquipment?.some?.((equipment) => equipment?.requiresEquipmentTime) ? dayjs() : null);
  const [checkInOutNote, setCheckInOutNote] = useState<string>('');
  const [vehicleCategoryId, setVehicleCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(false);

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

      const assignmentCoords = shift.assignment?.allowOfficerCheckIn ? shift.assignment?.geoFence : undefined;
      const eventCoords = shift.event?.allowOfficerCheckIn ? shift.event?.geoFence : undefined;
      // const coords = shift.assignment?.allowOfficerCheckIn ? shift.assignment?.geoFence || shift.event?.geoFence : shift.event?.geoFence;
      const requiresSpecificLocation = shift.assignment?.allowOfficerCheckIn || shift.event?.allowOfficerCheckIn;
      if (requiresSpecificLocation && (assignmentCoords || eventCoords) && !ignoreGeoFence) {
        if (!geoLocation || geoLocation.error?.message) {
          throw new Error('LOCATION_REQUIRED');
        }
        if (
          !isWithinPolygon(assignmentCoords as any, geoLocation) &&
          !isWithinPolygon(eventCoords as any, geoLocation)
        ) {
          throw new Error('LOCATION_NOT_WITHIN_GEOFENCE');
        }
      }

      const action = isCheckout ? checkOut : checkIn;
      const response = await action({
        variables: {
          input: {
            id: shift.id,
            note: checkInOutNote,
            ...(vehicleCategories && vehicleCategoryId && { vehicleCategoryId }),
            signNow: isCheckout && docusignCheckout,
            fromSelfCheckout,
            ...(requiredEquipmentTime && equipmentTime && {
              equipmentDateTime: equipmentTime.toISOString(),
            }),
            ...(geoLocation && {
              coords: {
                accuracy: geoLocation.accuracy,
                altitude: geoLocation.altitude,
                altitudeAccuracy: geoLocation.altitudeAccuracy,
                heading: geoLocation.heading,
                latitude: geoLocation.latitude,
                longitude: geoLocation.longitude,
                speed: geoLocation.speed,
              }
            }),
          },
        }
      });

      enqueueSnackbar(`${actionName} Success!`, { variant: 'success', autoHideDuration: 2000 });

      const url = response?.data?.checkOut?.signingUrl;
      if (url) {
        window.location.href = url;
      } else {
        await client.refetchQueries({
          include: [GET_ALL_SHIFTS],
        });
        setEquipmentTime(null);
        setCheckInOutNote('');
        confirm.onFalse();
        onSuccess?.(isCheckout ? CHECK_IN_OUT_STATUS.CHECKED_OUT : CHECK_IN_OUT_STATUS.CHECKED_IN);
      }

      if (!isCheckout) {
        overviewController.onTrue(shift);
      }
    } catch(error) {
      if (error.message === 'LOCATION_REQUIRED') {
        enqueueSnackbar(`Failed to ${actionName}. Location is required. Please enable location services.`, { variant: 'error' });
      } else if (error.message === 'LOCATION_NOT_WITHIN_GEOFENCE') {
        enqueueSnackbar(`Failed to ${actionName}. Location is not within the geofence. Please get closer to check ${actionName}.`, { variant: 'error' });
      } else {
        enqueueSnackbar(`Failed to ${actionName}. Please try again.`, { variant: 'error' });
      }
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
    fromSelfCheckout,
    ignoreGeoFence,
    vehicleCategories,
    vehicleCategoryId,
    now,
    requiredEquipmentTime,
    isCheckout,
    confirm,
    checkInOutNote,
    equipmentTime,
    geoLocation,
    docusignCheckout,
    overviewController,
  ]);

  return (
    <>
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
            {
              isCheckout && requiredVehicleInformation && (
                <VehicleCategoriesSelect
                  value={vehicleCategoryId}
                  onChange={(id) => setVehicleCategoryId(id)}
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
          </Stack>
        )}
        action={
          <LoadingButton loading={loading} variant="contained" onClick={() => handleCheckInOut(checkInOutConfirm!)}>
            {isCheckout ? 'Check out' : 'Check in'}
          </LoadingButton>
        }
      />
      <ShiftOverviewDialog isAdminView={user.member?.role === MemberRole.Admin} controller={overviewController} />
    </>
  )  
}
