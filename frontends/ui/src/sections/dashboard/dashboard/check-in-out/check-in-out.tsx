import { useCallback, useMemo, useState } from 'react';
// @mui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Card, { CardProps } from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
// hooks
import Carousel, { CarouselArrows, CarouselDots, useCarousel } from 'src/components/carousel';
// types
import { Shift } from 'src/__generated__/resolvers-types';
// components
import { useBoolean } from 'src/hooks/use-boolean';
import { getLocation } from 'src/utils/get-location';
import { useMutation } from '@apollo/client';
import { CHECK_IN, CHECK_OUT, GET_ALL_SHIFTS } from 'src/api/shifts';
import { client } from 'src/utils/apollo';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CheckInOutItem, { CheckInOutItemProps } from './check-in-out-item';

// ----------------------------------------------------------------------

interface Props extends CardProps {
  title?: string;
  subheader?: string;
  currentShifts?: Shift[];
}

export default function CheckInOut({ title, subheader, currentShifts, ...other }: Props) {
  const confirm = useBoolean();
  const [loading, setLoading] = useState(false);
  const [signNow, setSignNow] = useState(false);
  const [checkInOutConfirm, setCheckInOutConfirm] = useState<Shift | null>(null);
  const [checkInOutNote, setCheckInOutNote] = useState<string>('');
  const [equipmentTime, setEquipmentTime] = useState<number>(0);
  const isCheckout = useMemo(() => checkInOutConfirm?.shiftCheckInOut?.checkInTime, [checkInOutConfirm]);
  const [checkIn] = useMutation(CHECK_IN, {
    refetchQueries: [GET_ALL_SHIFTS],
  });
  const [checkOut] = useMutation(CHECK_OUT, {
    refetchQueries: [GET_ALL_SHIFTS],
  });


  const handleCheckInOut = useCallback(async (shift: Shift) => {
    try {
      setLoading(true);
      const location = await getLocation();
      const action = shift.shiftCheckInOut?.checkInTime ? checkOut : checkIn;
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

      const url = response?.data?.checkOut?.signingUrl;
      if (url) {
        window.open(url);
      }

      await client.refetchQueries({
        include: [GET_ALL_SHIFTS],
      });
      confirm.onFalse();
    } catch(error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [
    checkIn,
    checkOut,
    setLoading,
    confirm,
    checkInOutNote,
    equipmentTime,
    signNow,
  ]);

  const recentNotifications: CheckInOutItemProps[] = useMemo(() => {
    const shiftList = currentShifts || [];
    return shiftList.map((shift) => ({
      shift,
      onClick: () => {
        setCheckInOutConfirm(shift)
        confirm.onTrue();
      },
    }));
  }, [currentShifts, confirm, setCheckInOutConfirm]);

  const carousel = useCarousel({
    adaptiveHeight: true,
    ...CarouselDots({
      sx: {
        top: 5,
        left: 25,
        position: 'absolute',
        color: 'primary.light',
      },
    }),
  });

  const renderNotifications = useMemo(() => {
    if (recentNotifications?.length) {
      return (
        <Carousel ref={carousel.carouselRef} {...carousel.carouselSettings}>
          {recentNotifications.map((item) => (
            <CheckInOutItem key={item.shift.id} shift={item.shift} onClick={item.onClick} />
          ))}
        </Carousel>
      );
    }
    // empty shifts
    return (
      <Stack spacing={0.5} alignItems="center" justifyContent="center" sx={{ pt: 2.5, pb: 6 }}>
        <Box
          component="img"
          alt="empty content"
          src="/assets/icons/empty/ic_mail.svg"
          sx={{ width: 1, maxWidth: 100 }}
        />
        <Typography
          variant="subtitle1"
          component="span"
          sx={{ color: 'text.secondary', textAlign: 'center' }}
        >
          No Shifts Ready for Check in/out
        </Typography>
        <Typography
          variant="body2"
          component="span"
          sx={{ color: 'text.secondary', textAlign: 'center' }}
        >
          {`You're all caught up!`}
        </Typography>
      </Stack>
    );
  }, [recentNotifications, carousel]);

  return (
    <>
      <Card {...other}>
        <CardHeader
          title={title}
          subheader={subheader}
          action={<CarouselArrows onNext={carousel.onNext} onPrev={carousel.onPrev} />}
        />

        {renderNotifications}
      </Card>

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
    </>
  );
}
