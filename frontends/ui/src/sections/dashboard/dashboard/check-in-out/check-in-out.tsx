import { useMemo, useState } from 'react';
// @mui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Card, { CardProps } from '@mui/material/Card';
// hooks
import Carousel, { CarouselArrows, CarouselDots, useCarousel } from 'src/components/carousel';
// types
import { Shift } from 'src/__generated__/resolvers-types';
// components
import { useBoolean } from 'src/hooks/use-boolean';
import CheckInOutConfirm from 'src/components/shifts/check-in-out-confirm';
import CheckInOutItem, { CheckInOutItemProps } from './check-in-out-item';

// ----------------------------------------------------------------------

interface Props extends CardProps {
  title?: string;
  subheader?: string;
  currentShifts?: Shift[];
}

export default function CheckInOut({ title, subheader, currentShifts, ...other }: Props) {
  const confirm = useBoolean();
  const [checkInOutConfirm, setCheckInOutConfirm] = useState<Shift | null>(null);

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

      <CheckInOutConfirm
        fromKiosk
        confirm={confirm}
        checkInOutConfirm={checkInOutConfirm}
      />
    </>
  );
}
