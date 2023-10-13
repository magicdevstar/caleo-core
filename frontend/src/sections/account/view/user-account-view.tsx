// @mui
import { useQuery } from '@apollo/client';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { MemberRole } from 'src/__generated__/resolvers-types';
import { _mock } from 'src/_mock';
import { FrontendUser, GET_USER } from 'src/api/user';
import { useAuthContext } from 'src/auth/hooks';
// components
import { LoadingScreen } from 'src/components/loading-screen';
import { useSettingsContext } from 'src/components/settings';
import MainAccountView from 'src/components/user/account-view';

// ----------------------------------------------------------------------

export default function AccountView() {
  const { user } = useAuthContext();
  const { data, loading } = useQuery(GET_USER, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      id: user.id,
    }, 
  });
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Typography variant="h4"> Profile </Typography>
      {
        loading ? (
          <LoadingScreen
            sx={{
              borderRadius: 1.5,
              bgcolor: 'background.default',
            }}
          />
        ) : (
          <MainAccountView
            adminViewer={user?.superAdmin || user?.member?.role === MemberRole.Admin}
            user={{
              ...data?.user,
              displayName: data?.user?.name,
              photoURL: _mock.image.avatar(24),
            } as FrontendUser}
          />
        )
      }
    </Container>
  );
}
