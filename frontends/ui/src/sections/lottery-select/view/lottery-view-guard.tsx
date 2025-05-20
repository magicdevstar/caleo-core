import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { m } from 'framer-motion';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { capitalize } from "lodash";
import { ACTIVE_LOTTERY } from 'src/api/organization';
// @mui
import Typography from '@mui/material/Typography';
// hooks
import { useAuthContext } from 'src/auth/hooks';
import { convertDate, useDateFormats } from "src/hooks/use-datejs";
// components
import { LoadingScreen } from 'src/components/loading-screen';
import LotteryAnalytics from 'src/components/analytics/lottery-analytics';
import { MotionContainer, varFade } from 'src/components/animate';
import LotteryView from './lottery-view';

// ----------------------------------------------------------------------

dayjs.extend(utc);
dayjs.extend(timezone);

export default function LotteryViewGuard() {
  const { user } = useAuthContext();
  const { timeFormat } = useDateFormats();
  const { data, loading } = useQuery(ACTIVE_LOTTERY, {
    pollInterval: 5000,
  });
  const activeLottery = data?.activeLottery || false;

  const lottery = useMemo(() => user?.member?.org?.settings?.lottery, [user]);
  const lotteryOpenTime = useMemo(() => convertDate({date: user?.member?.org?.settings?.lottery?.open?.time || '', user}), [user]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (activeLottery) {
    return <LotteryView />;
  }

  return (
    <MotionContainer sx={{
      mx: 'auto',
      p: 5,
      textAlign: 'center',
      justifyContent: 'center',
    }}>
      <m.div variants={varFade().in}>
        <Typography variant="h3">
          {`Rank Order ${!activeLottery ? 'Period is Closed' : 'System is Disabled'}`}
        </Typography>
      </m.div>

      { !activeLottery ? (
          <m.div variants={varFade().in}>
            <Typography sx={{ color: 'text.secondary' }}>
              The rank order period is now closed. Come back on
              <Typography component="span" variant="h6" sx={{ color: 'text.secondary', my: 1 }}>
                {` ${capitalize(lottery?.open?.dayOfWeek || '')} at ${lotteryOpenTime.format(timeFormat)} `}
              </Typography>
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

      <m.div variants={varFade().in} style={{ marginTop: '10px', marginBottom: '10px' }}>
        <LotteryAnalytics />
      </m.div>
    </MotionContainer>
  );
}
