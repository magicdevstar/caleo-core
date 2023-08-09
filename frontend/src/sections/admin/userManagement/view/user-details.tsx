// @mui
import Container from '@mui/material/Container';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import MainAccountView from 'src/sections/account/account-view';

// ----------------------------------------------------------------------

export default function UserDetail() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="User Detail"
        links={[
          { name: 'User Search', href: paths.dashboard.admin.users.root },
          {
            name: 'User Detail',
            href: paths.dashboard.admin.users.userDetail,
          },
        ]}
        sx={{ mb: 1 }}
      />

      <MainAccountView excludePassword />
    </Container>
  );
}
