import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
// @mui
import { useTheme, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import LoadingButton from "@mui/lab/LoadingButton";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
// Types
import { Shift } from "src/__generated__/resolvers-types";
import { CHECK_IN, CHECK_OUT, GET_ALL_SHIFTS } from "src/api/shifts";
// Hooks
import { useAuthContext } from "src/auth/hooks";
import { convertDate, getNow } from "src/hooks/use-datejs";
import { client } from "src/utils/apollo";
import { useFeatures } from "src/hooks/use-features";
// Components
import Iconify from "src/components/iconify";
import { getLocation } from "src/utils/get-location";
import { useBoolean } from "src/hooks/use-boolean";
import { ConfirmDialog } from "../custom-dialog";

export default function CheckInOut() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { eventCheckIn } = useFeatures();
  const confirm = useBoolean();
  const [checkInOutConfirm, setCheckInOutConfirm] = useState<Shift | null>(null);
  const [checkInOutNote, setCheckInOutNote] = useState<string>('');
  const minutesBeforeStartTime = user.member.org?.settings?.checkInOut?.minutesBeforeShiftStart || 15;
  const minutesAfterEndTime = user.member.org?.settings?.checkInOut?.minutesAfterShiftEnd || 60;

  const filter = useMemo(() => ({
    limit: 5,
    skip: 0,
    orderBy: 'startTime',
    order: 'asc',
    userId: user?.id,
    startTime: dayjs().subtract(minutesBeforeStartTime, 'minutes').toISOString(),
  }), [minutesBeforeStartTime, user]);

  const { data } = useQuery(GET_ALL_SHIFTS, {
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'cache-first',
    variables: {
      input: filter,
    },
  });
  const shifts = useMemo(() => (data?.shifts?.items || []) as Shift[], [data]);

  const [loading, setLoading] = useState(false);
  const [checkIn] = useMutation(CHECK_IN, {
    refetchQueries: [GET_ALL_SHIFTS],
  });
  const [checkOut] = useMutation(CHECK_OUT, {
    refetchQueries: [GET_ALL_SHIFTS],
  });

  const currentShifts = useMemo(() => {
    const runningShifts = shifts.filter(({
      startTime,
      endTime,
      shiftCheckInOut
    }) => {
      if (eventCheckIn) {
        if (shiftCheckInOut?.checkInTime && shiftCheckInOut.checkOutTime) {
          return false;
        }
        const now = getNow({ organization: user.member.org! });
        const formattedStart = convertDate({
          date: new Date(startTime),
          user,
        });
        const formattedEnd = convertDate({
          date: new Date(endTime),
          user,
        });
        return now.add(minutesBeforeStartTime, 'minutes').isAfter(formattedStart) && now.isBefore(formattedEnd.add(minutesAfterEndTime, 'minutes'));
      }
      return false;
    });

    return runningShifts;
  }, [shifts, user, minutesAfterEndTime, minutesBeforeStartTime, eventCheckIn]);

  const handleCheckInOut = useCallback(async (shift: Shift) => {
    try {
      setLoading(true);
      const location = await getLocation();
      const action = shift.shiftCheckInOut?.checkInTime ? checkOut : checkIn;
      await action({
        variables: {
          input: {
            id: shift.id,
            note: checkInOutNote,
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
      await client.refetchQueries({
        include: [GET_ALL_SHIFTS],
      });
      confirm.onFalse();
    } catch(error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [checkIn, checkOut, setLoading, confirm, checkInOutNote]);

  if (currentShifts.length === 0) {
    return null;
  }

  return (
    <>
      <Box>
        <Typography variant="h4" gutterBottom>
          Shift Check In/Check Out
        </Typography>
      </Box>
      <Box
        gap={3}
        display="grid"
        sx={{ mb: 1 }}
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
      >
        {
          currentShifts.map((shift) => (
            <Card key={shift.id} sx={{ background: alpha(theme.palette.background.paper, 0.5) }}>
              <CardContent>
                <Stack spacing={2}>
                  <ListItemText
                    primary={shift.event.name}
                    secondary={shift.assignment.name}
                    secondaryTypographyProps={{
                      mt: 0.5,
                      component: 'span',
                      typography: 'caption',
                      color: 'text.disabled',
                    }}
                  />

                  <Stack spacing={1} direction="row">
                    <LoadingButton
                      loading={loading}
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        setCheckInOutConfirm(shift)
                        confirm.onTrue();
                      }}
                      startIcon={shift.shiftCheckInOut?.checkInTime ? <Iconify icon="solar:logout-2-bold-duotone" /> : <Iconify icon="solar:login-2-bold-duotone" />}
                    >{shift.shiftCheckInOut?.checkInTime ? 'Check Out' : 'Check In'}</LoadingButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))
        }
      </Box>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={checkInOutConfirm?.shiftCheckInOut?.checkInTime ? 'Confirm checking out?' : 'Confirm checking in?'}
        content={(
          <TextField
            label="Type to add a note"
            multiline
            fullWidth
            sx={{ mt: 1 }}
            rows={4}
            onBlur={(event) => {
              setCheckInOutNote(event.target.value)
            }}
          />
        )}
        action={
          <LoadingButton loading={loading} variant="contained" onClick={() => handleCheckInOut(checkInOutConfirm!)}>
            {checkInOutConfirm?.shiftCheckInOut?.checkInTime ? 'Check out' : 'Check in'}
          </LoadingButton>
        }
      />
    </>
  );
}
