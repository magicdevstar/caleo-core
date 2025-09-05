import { useMemo } from 'react';
// @mui
import useMediaQuery from '@mui/material/useMediaQuery';
import Container from '@mui/material/Container/Container';
import Grid from '@mui/material/Unstable_Grid2';
import { useTheme } from "@mui/material/styles";
// hooks
import { useAuthContext } from 'src/auth/hooks';
import { useSettingsContext } from 'src/components/settings';
import { useCheckInOut } from 'src/hooks/use-check-in-out';
import { useFeatures } from 'src/hooks/use-features';
// components
import SeoIllustration from 'src/assets/illustrations/seo-illustration';
import AppWelcome from 'src/components/app/app-welcome';
import RecentNotifications from '../dashboard/recent-notifications/recent-notifications';
import OvertimeShifts from '../dashboard/overtime-shifts/overtime-shifts';
import CheckInOut from '../dashboard/check-in-out/check-in-out';
import { ActiveIncidentsTable } from '../dashboard/incidents/active-incidents-table';

export default function DashboardView() {
  const theme = useTheme();
  const sxView = useMediaQuery(theme.breakpoints.down('md'));
  const { currentShifts } = useCheckInOut();
  const { user } = useAuthContext();
  const { officerCheckInOut, incidentEvents } = useFeatures();
  const settings = useSettingsContext();

  const hasCheckInOutShifts = officerCheckInOut && currentShifts.length > 0;

  const sizes = useMemo(() => {
    let layout: any = {
      welcome: 8,
      notifications: 4,
    };
    if (hasCheckInOutShifts) {
      layout = {
        welcome: 4,
        checkIn: 4,
        notifications: 4,
      };
    }
    if (incidentEvents) {
      layout = {
        welcome: 4,
        incidents: 8,
        // notifications: 4,
      };
      if (hasCheckInOutShifts) {
        layout = {
          incidents: 6,
          checkIn: 6,
        };
      }
    }
    return layout;
  }, [incidentEvents, hasCheckInOutShifts]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'} sx={{ maxWidth: '100vw' }}>
      <Grid container spacing={3}>
        {
          sizes.welcome && !sxView && (
            <Grid xs={12} md={sizes.welcome}>
              <AppWelcome title={`Welcome back 👋 \n ${user?.displayName}`} img={sizes.welcome > 4 ? <SeoIllustration /> : <span />} />
            </Grid>
          )
        }
        {
          sizes.incidents && (
            <Grid xs={12} md={sizes.incidents}>
              <ActiveIncidentsTable />
            </Grid>
          )
        }
        {
          hasCheckInOutShifts && (
            <Grid xs={12} md={sizes.checkIn}>
              <CheckInOut title="Check in/out" currentShifts={currentShifts} sx={{ height: '100%' }} />
            </Grid>
          )
        }
        {
          sizes.notifications && (
            <Grid xs={12} md={sizes.notifications}>
              <RecentNotifications title="New Notifications" />
            </Grid>
          )
        }
        <Grid xs={12}>
          <OvertimeShifts />
        </Grid>
      </Grid>
    </Container>
  );
}
