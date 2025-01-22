// @mui
import Container from '@mui/material/Container';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import VenuesTable from '../venues/venues-table';

// ----------------------------------------------------------------------

export default function VenuesView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Venues"
        links={[
          { name: 'Venues' },
        ]}
        sx={{
          mb: { xs: 3, md: 3 },
        }}
      />
      <VenuesTable />
    </Container>
  );
}
