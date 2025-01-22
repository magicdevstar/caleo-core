import useSWR from 'swr';
import { m } from 'framer-motion';
// @mui
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// assets
import { ForbiddenIllustration } from 'src/assets/illustrations';
// components
import { MotionContainer, varBounce } from 'src/components/animate';
import { GET_SITE_LOCK } from 'src/api/lotteryCounter';
import { MemberRole, SiteLock } from 'src/__generated__/resolvers-types';
import { client } from 'src/utils/apollo';

// ----------------------------------------------------------------------

type LotteryLockGuardProp = {
  children: React.ReactNode;
};

const POLL_INTERVAL = 2000;

export default function LotteryLockGuard({ children }: LotteryLockGuardProp) {
  const { user } = useAuthContext();
  const isAdmin = user?.member?.role === MemberRole.Admin;

  const { data } = useSWR(
    isAdmin ? null : ['/site/lock'],
    () => client.query<{ siteLock: SiteLock }>({
      query: GET_SITE_LOCK,
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    }),
    {
      refreshInterval: POLL_INTERVAL,
    }
  );

  if (data?.data?.siteLock?.locked && !isAdmin) {
    return (
      <Container component={MotionContainer} sx={{ textAlign: 'center' }}>
        <m.div variants={varBounce().in}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Site is locked
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <Typography sx={{ color: 'text.secondary' }}>
            {
              data?.data?.siteLock?.message ||
              'The site is locked while the lottery is running. The site will be unlocked soon.'
            }
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <ForbiddenIllustration
            sx={{
              height: 260,
              my: { xs: 5, sm: 10 },
            }}
          />
        </m.div>
      </Container>
    );
  }

  return <> {children} </>;
}
