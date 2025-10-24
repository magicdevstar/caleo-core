// @mui
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
// components
import { useSettingsContext } from 'src/components/settings';
import ADTable from '../assignmentDivision/assignmentDivision-table';
import AGTable from '../assignmentGroup/assignmentGroup-table';
import BranchTable from '../branch/branch-table';

// ----------------------------------------------------------------------

export default function MiscView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'} sx={{ pb: { xs: 1, md: 2, lg: 4 } }}>
      <ADTable />
      <Box sx={{ mb: 4 }} />
      <AGTable />
      <Box sx={{ mb: 4 }} />
      <BranchTable />
    </Container>
  );
}
