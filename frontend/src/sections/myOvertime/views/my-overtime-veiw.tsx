// @mui
import Container from '@mui/material/Container';
// components
import { useSettingsContext } from 'src/components/settings';
import MyOvertimeTable from '../myOvertime/my-overtime-table';

// ----------------------------------------------------------------------

export default function MyOvertimeView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <MyOvertimeTable />
    </Container>
  );
}
