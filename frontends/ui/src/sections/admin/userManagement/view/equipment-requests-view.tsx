// @mui
import Container from '@mui/material/Container';
// components
import { useSettingsContext } from 'src/components/settings';
import EquipmentTable from '../equipment/equipment-table';

// ----------------------------------------------------------------------

export default function EquipmentRequestsView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <EquipmentTable />
    </Container>
  );
}
