// @mui
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { RouterLink } from 'src/routes/components';
import Iconify from 'src/components/iconify';
import { useBoolean } from 'src/hooks/use-boolean';
import UserTable from '../users/user-table';
import InviteUserModal from '../inviteUser/invite-user-modal';

// ----------------------------------------------------------------------

export default function ProductListView() {
  const settings = useSettingsContext();
  const inviteUser = useBoolean();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="User Search"
        links={[
          { name: 'User Search' },
        ]}
        action={
          <Button
            component={RouterLink}
            /* TODO Change the path */
            onClick={inviteUser.onTrue}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Invite User
          </Button>
        }
        sx={{
          mb: { xs: 3, md: 3 },
        }}
      />

      <UserTable />
      <InviteUserModal inviteUser={inviteUser} />
    </Container>
  );
}
