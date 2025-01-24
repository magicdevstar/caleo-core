// @mui
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// components
import { useSettingsContext } from 'src/components/settings';
import RankTable from '../rank/rank-table';
import SkillTable from '../skills/skill-table';
import EquipmentTable from '../equipment/equipment-table';

// ----------------------------------------------------------------------

export default function RanksAndSkillsView() {
  const { user } = useAuthContext();
  const settings = useSettingsContext();

  console.log(user.member.org);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'} sx={{ pb: { xs: 1, md: 2, lg: 4 } }}>
      <RankTable />
      <Box sx={{ mb: 4 }} />
      <SkillTable />
      {user?.member?.org?.features?.equipment && (
        <>
          <Box sx={{ mb: 4 }} />
          <EquipmentTable />
        </>
      )}
    </Container>
  );
}
