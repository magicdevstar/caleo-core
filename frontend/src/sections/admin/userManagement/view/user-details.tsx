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
import QueryView from 'src/components/query-view';
import MainAccountView from 'src/components/user/account-view';

// ----------------------------------------------------------------------

export default function UserDetail() {
  const settings = useSettingsContext();
  const params = useParams();

  const { data, refetch, loading, error } = useQuery(GET_USER, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    notifyOnNetworkStatusChange: true,
    variables: {
      id: params.id,
    },
  });

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'} sx={{ pb: 2 }}>
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

      <QueryView
        loading={loading}
        error={!!error}
        errorTitle='Failed to Load User'
        errorDescription='There was an error loading User details. Please try again.'
        onRetry={refetch}
      >
        <MainAccountView excludePassword adminViewer user={{
          ...data?.user,
          displayName: data?.user?.name,
          photoURL: _mock.image.avatar(24),
        } as FrontendUser} />
      </QueryView>
    </Container>
  );
}
