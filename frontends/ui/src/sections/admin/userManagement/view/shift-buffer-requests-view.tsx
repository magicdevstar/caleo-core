// @mui
import Container from '@mui/material/Container';
// components
import { useSettingsContext } from 'src/components/settings';
import ShiftBufferRequestsTable from '../shiftBufferRequests/shift-buffer-requests-table';

// ----------------------------------------------------------------------

export default function ShiftBufferRequestsView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <ShiftBufferRequestsTable />
    </Container>
  );
}
