// @mui
import Container from '@mui/material/Container';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EventTemplateTable from '../templates/events-table';

// ----------------------------------------------------------------------

export default function TemplateEventsView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Event Templates"
        links={[
          { name: 'Event Templates' },
        ]}
        sx={{
          mb: { xs: 3, md: 3 },
        }}
      />
      <EventTemplateTable />
    </Container>
  );
}
