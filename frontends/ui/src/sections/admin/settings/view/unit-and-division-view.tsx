// @mui
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
// components
import { useSettingsContext } from 'src/components/settings';
import UnitTable from '../unit/unit-table';
import DivisionTable from '../division/division-table';

// ----------------------------------------------------------------------

export default function UnitAndDivisionView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'} sx={{ pb: { xs: 1, md: 2, lg: 4 } }}>
      <UnitTable />
      <Box sx={{ mb: 4 }} />
      <DivisionTable />
    </Container>
  );
}
