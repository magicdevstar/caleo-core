// @mui
import { useQuery } from '@apollo/client';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { MemberRole } from 'src/__generated__/resolvers-types';
import { _mock } from 'src/_mock';
import { FrontendUser, GET_USER } from 'src/api/user';
import { useAuthContext } from 'src/auth/hooks';
// components
import { useSettingsContext } from 'src/components/settings';
import QueryView from 'src/components/query-view';
import MainAccountView from 'src/components/user/account-view';

// ----------------------------------------------------------------------

export default function AccountView() {
  const { user } = useAuthContext();
  const { data, refetch, loading, error } = useQuery(GET_USER, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    notifyOnNetworkStatusChange: true,
    variables: {
      id: user.id,
    },
  });
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'} sx={{ pb: { xs: 1, md: 2, lg: 4 } }}>
      <Typography variant="h4"> Profile </Typography>
      <QueryView
        loading={loading}
        error={!!error}
        errorTitle='Failed to Load Profile'
        errorDescription='There was an error loading your Profile details. Please try again.'
        onRetry={refetch}
      >
        <MainAccountView
          adminViewer={user?.superAdmin || user?.member?.role === MemberRole.Admin}
          user={{
            ...data?.user,
            displayName: data?.user?.name,
            photoURL: _mock.image.avatar(24),
          } as FrontendUser}
        />
      </QueryView>
    </Container>
  );
}
