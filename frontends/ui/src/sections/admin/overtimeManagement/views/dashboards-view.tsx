// @mui
import Container from '@mui/material/Container';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import DashboardsTable from '../events/dashboards-table';

// ----------------------------------------------------------------------

export default function DashboardsView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Dashboards"
        links={[
          { name: 'Dashboards' },
        ]}
        sx={{
          mb: { xs: 3, md: 3 },
        }}
      />
      <DashboardsTable />
    </Container>
  );
}
