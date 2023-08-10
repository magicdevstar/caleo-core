// @apollo/client
import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
// hooks
import { useParams } from 'src/routes/hooks';
// types
import { paths } from 'src/routes/paths';
import { _mock } from 'src/_mock';
import { FrontendUser, GET_USER } from 'src/api/user';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import MainAccountView from 'src/components/user/account-view';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

export default function UserDetail() {
  const settings = useSettingsContext();
  const params = useParams();

  const { data, loading } = useQuery(GET_USER, {
    variables: {
      id: params.id,
    }, 
  });

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

      {
        loading ? (
          <LoadingScreen
            sx={{
              borderRadius: 1.5,
              bgcolor: 'background.default',
            }}
          />
        ) : (
          <MainAccountView excludePassword user={{
            ...data?.user,
            displayName: data?.user?.name,
            photoURL: _mock.image.avatar(24),
          } as FrontendUser} />
        )
      }
    </Container>
  );
}
