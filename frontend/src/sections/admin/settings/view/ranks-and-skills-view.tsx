// @mui
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
// components
import { useSettingsContext } from 'src/components/settings';
import RankTable from '../rank/rank-table';
import SkillTable from '../skills/skill-table';

// ----------------------------------------------------------------------

export default function ProductListView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <RankTable />
      <Box sx={{ mb: 4 }} />
      <SkillTable />
    </Container>
  );
}
