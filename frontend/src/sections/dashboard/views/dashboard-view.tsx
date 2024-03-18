// @mui
import Container from '@mui/material/Container/Container';
import Grid from '@mui/material/Unstable_Grid2';
// hooks
import { useAuthContext } from 'src/auth/hooks';
import { useSettingsContext } from 'src/components/settings';
// components
import SeoIllustration from 'src/assets/illustrations/seo-illustration';
import AppWelcome from 'src/components/app/app-welcome';
import RecentNotifications from '../dashboard/recent-notifications/recent-notifications';
import OvertimeShifts from '../dashboard/overtime-shifts/overtime-shifts';

export default function DashboardView() {
  const { user } = useAuthContext();
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'} sx={{ maxWidth: '100vw' }}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <AppWelcome title={`Welcome back 👋 \n ${user?.displayName}`} img={<SeoIllustration />} />
        </Grid>
        <Grid xs={12} md={4}>
          <RecentNotifications title="New Notifications" />
        </Grid>
        <Grid xs={12}>
          <OvertimeShifts />
        </Grid>
      </Grid>
    </Container>
  );
}
