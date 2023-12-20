// @apollo/client
import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
// hooks
import { useParams } from 'src/routes/hooks';
// types
import { GET_NOTIFICATION } from 'src/api/notification';
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import QueryView from 'src/components/query-view';
import EditNotification from '../notifications/edit-notification';

// ----------------------------------------------------------------------

export default function NotificationView() {
  const settings = useSettingsContext();
  const params = useParams();

  const { data, refetch, loading, error } = useQuery(GET_NOTIFICATION, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    // notifyOnNetworkStatusChange: true,
    skip: params.id === 'new',
    variables: {
      id: params.id,
    },
  });

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Notification Detail"
        links={[
          { name: 'Notifications', href: paths.dashboard.admin.settings.notifications },
          {
            name: 'Notification Detail',
          },
        ]}
        sx={{ mb: { xs: 3, md: 3 } }}
      />

      <QueryView
        loading={loading}
        error={!!error}
        errorTitle='Failed to Load Notification'
        errorDescription='There was an error loading Notification details. Please try again.'
        onRetry={refetch}
      >
        <EditNotification currentNotification={data?.notification} />
      </QueryView>
    </Container>
  );
}
