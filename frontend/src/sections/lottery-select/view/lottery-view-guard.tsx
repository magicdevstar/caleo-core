import { useEffect, useMemo, useState } from 'react';
import { m } from 'framer-motion';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { capitalize } from "lodash";
// @mui
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
// hooks
import { useAuthContext } from 'src/auth/hooks';
import { convertDate, timeFormat, getNow } from "src/hooks/use-datejs";
// routes
import { RouterLink } from 'src/routes/components';
// assets
import * as Illustrations from 'src/assets/illustrations';
// components
import { MotionContainer, varFade } from 'src/components/animate';
import LotteryView from './lottery-view';

// ----------------------------------------------------------------------

const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

dayjs.extend(utc);
dayjs.extend(timezone);

export default function LotteryViewGuard() {
  const { user } = useAuthContext();
  const [currentTime, setCurrentTime] = useState(getNow({ organization: user?.member?.org || {} as any }));

  useEffect(() => {
    // Time interval to continue updating current time
    const interval = setInterval(() => {
      setCurrentTime(getNow({ organization: user?.member?.org || {} as any }));
    }, 5000);
    return () => {
      clearInterval(interval)
    };
  }, [user]);

  const lottery = useMemo(() => user?.member?.org?.settings?.lottery, [user]);
  const lotteryOpenTime = useMemo(() => convertDate({date: user?.member?.org?.settings?.lottery?.open?.time || '', user}), [user]);
  const lotteryOpenWeekday = useMemo(() => weekdays.indexOf(user?.member?.org?.settings?.lottery?.open?.dayOfWeek.toLowerCase() || ''), [user]);
  const lotteryCloseTime = useMemo(() => convertDate({date: user?.member?.org?.settings?.lottery?.close?.time || '', user}), [user]);
  const lotteryCloseWeekday = useMemo(() => weekdays.indexOf(user?.member?.org?.settings?.lottery?.close?.dayOfWeek.toLowerCase() || ''), [user]);
  const hasValidLottery = Boolean(lottery?.open?.time && lottery?.open?.dayOfWeek && lottery?.close?.time && lottery?.close?.dayOfWeek);

  // Check if lottery week interval is in same week or crosses weeks (ex. Thursday to Tuesday is not same week so comparison is different)
  let sameWeek = lotteryOpenWeekday < lotteryCloseWeekday;
  if (lotteryOpenWeekday === lotteryCloseWeekday) {
    if (lotteryOpenTime.hour() === lotteryCloseTime.hour()) {
      if (lotteryOpenTime.minute() === lotteryCloseTime.minute()) {
        sameWeek = false;
      } else {
        sameWeek = lotteryOpenTime.minute() < lotteryCloseTime.minute();
      }
    } else {
      sameWeek = lotteryOpenTime.hour() < lotteryCloseTime.hour();
    }
  }
  const afterStartDay = currentTime.day() >= lotteryOpenWeekday;
  const beforeCloseDay = currentTime.day() <= lotteryCloseWeekday;
  const withinWeek = sameWeek ? afterStartDay && beforeCloseDay : afterStartDay || beforeCloseDay;

  // Have to compare hours and minutes since the date saved in lottery settings is 1 day apart so dates can't be compared
  const withinOpenHour = currentTime.day() === lotteryOpenWeekday ? currentTime.hour() >= lotteryOpenTime.hour() : true;
  const withinCloseHour = currentTime.day() === lotteryCloseWeekday ? currentTime.hour() <= lotteryCloseTime.hour() : true;
  const withinHour = withinOpenHour && withinCloseHour;
  const withinOpenMinute = currentTime.hour() === lotteryOpenTime.hour() ? currentTime.minute() >= lotteryOpenTime.minute() : true;
  const withinCloseMinute = currentTime.hour() === lotteryCloseTime.hour() ? currentTime.minute() <= lotteryCloseTime.minute() : true;
  const withinMinute = withinOpenMinute && withinCloseMinute;

  if (lottery?.enabled && hasValidLottery && withinWeek && withinHour && withinMinute) {
    return <LotteryView />;
  }

  return (
    <MotionContainer sx={{
      mx: 'auto',
      p: 5,
      maxWidth: 600,
      textAlign: 'center',
      justifyContent: 'center',
    }}>
      <m.div variants={varFade().in}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          {`Rank Order ${lottery?.enabled ? 'Period is Closed' : 'System is Disabled'}`}
        </Typography>
      </m.div>

      { lottery?.enabled ? (
          <m.div variants={varFade().in}>
            <Typography sx={{ color: 'text.secondary' }}>
              The rank order period is now closed. Come back on
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', my: 1 }}>
              {`${capitalize(lottery?.open?.dayOfWeek || '')} at ${lotteryOpenTime.format(timeFormat)}`}
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              to rank your shifts for the next period.
            </Typography>
          </m.div>
        ) : (
          <m.div variants={varFade().in}>
            <Typography sx={{ color: 'text.secondary' }}>
              The rank order system is currently disabled.
            </Typography>
          </m.div>
        )
      }

      <m.div variants={varFade().in}>
        <Illustrations.ComingSoonIllustration
          sx={{
            height: 260,
            my: { xs: 5, sm: 10 },
          }}
        />
      </m.div>

      <Button component={RouterLink} href="/dashboard/available/overtime" size="large" variant="contained">
        See Available Overtime
      </Button>
    </MotionContainer>
  );
}
