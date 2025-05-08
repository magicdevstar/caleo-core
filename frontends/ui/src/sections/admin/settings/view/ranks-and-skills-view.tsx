// @mui
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
// hooks
import { useFeatures } from 'src/hooks/use-features';
// components
import { useSettingsContext } from 'src/components/settings';
import RankTable from '../rank/rank-table';
import SkillTable from '../skills/skill-table';
import EquipmentTable from '../equipment/equipment-table';
import VehicleCategoriesTable from '../vehicleCategories/vehicleCategories-table';

// ----------------------------------------------------------------------

export default function RanksAndSkillsView() {
  const { equipment, vehicleCategories } = useFeatures();
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'} sx={{ pb: { xs: 1, md: 2, lg: 4 } }}>
      <RankTable />
      <Box sx={{ mb: 4 }} />
      <SkillTable />
      {equipment && (
        <>
          <Box sx={{ mb: 4 }} />
          <EquipmentTable />
        </>
      )}
      {vehicleCategories && (
        <>
          <Box sx={{ mb: 4 }} />
          <VehicleCategoriesTable />
        </>
      )}
    </Container>
  );
}
