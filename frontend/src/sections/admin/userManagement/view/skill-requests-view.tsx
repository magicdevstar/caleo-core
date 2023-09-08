// @mui
import Container from '@mui/material/Container';
// components
import { useSettingsContext } from 'src/components/settings';
import SkillTable from '../skills/skill-table';

// ----------------------------------------------------------------------

export default function SkillRequestsView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <SkillTable />
    </Container>
  );
}
