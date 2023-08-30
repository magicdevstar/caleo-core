// @mui
import Container from '@mui/material/Container';
// components
import { useSettingsContext } from 'src/components/settings';
import AvailableOvertimeTable from '../availableOvertime/available-overtime-table';

// ----------------------------------------------------------------------

export default function AvailableOvertimeView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <AvailableOvertimeTable />
    </Container>
  );
}
