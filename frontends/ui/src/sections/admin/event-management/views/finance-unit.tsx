// @mui
import Container from '@mui/material/Container';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import FinanceUnitTable from '../finance-unit/finance-unit-table';

// ----------------------------------------------------------------------

export default function FinanceUnitView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Finance Unit"
        links={[
          { name: 'Finance Unit' },
        ]}
        sx={{
          mb: { xs: 3, md: 3 },
        }}
      />
      <FinanceUnitTable />
    </Container>
  );
}
