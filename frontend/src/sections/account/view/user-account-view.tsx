// @mui
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
// _mock
import { _userAbout, _userPlans, _userPayment, _userInvoices, _userAddressBook } from 'src/_mock';
// components
import { useSettingsContext } from 'src/components/settings';
//
import MainAccountView from '../account-view';

// ----------------------------------------------------------------------

export default function AccountView() {

  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Typography variant="h4"> Profile </Typography>
      <MainAccountView />
    </Container>
  );
}
