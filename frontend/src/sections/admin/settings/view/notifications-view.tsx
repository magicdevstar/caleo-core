// @mui
import Container from '@mui/material/Container';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import NotificationTable from '../notifications/notifications-table';

// ----------------------------------------------------------------------

export default function NotificationView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Notifications"
        links={[
          { name: 'Notifications' },
        ]}
        sx={{
          mb: { xs: 3, md: 3 },
        }}
      />
      <NotificationTable />
    </Container>
  );
}
