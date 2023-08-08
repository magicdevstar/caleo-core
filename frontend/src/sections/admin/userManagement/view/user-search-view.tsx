// @mui
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';
import Iconify from 'src/components/iconify';
import UserTable from '../users/user-table';

// ----------------------------------------------------------------------

export default function ProductListView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="User Search"
        links={[
          { name: 'UserSearch' },
        ]}
        action={
          <Button
            component={RouterLink}
            /* TODO Change the path */
            href={paths.dashboard.root}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Invite User
          </Button>
        }
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <UserTable />
    </Container>
  );
}
