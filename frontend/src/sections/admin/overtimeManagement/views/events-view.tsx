// @mui
import Container from '@mui/material/Container';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EventsTable from '../events/events-table';

// ----------------------------------------------------------------------

export default function EventsView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Events"
        links={[
          { name: 'Events' },
        ]}
        sx={{
          mb: { xs: 3, md: 3 },
        }}
      />
      <EventsTable />
    </Container>
  );
}
