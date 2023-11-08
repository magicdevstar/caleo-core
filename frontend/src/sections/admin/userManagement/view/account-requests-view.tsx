// @mui
import Container from '@mui/material/Container';
// components
import { useSettingsContext } from 'src/components/settings';
import AccountRequestsTable from '../accountRequests/account-requests-table';

export default function AccountRequestsView() {
  const settings =  useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <AccountRequestsTable />
    </Container>
  );
}
