// @apollo/client
import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
// hooks
import { useParams } from 'src/routes/hooks';
// types
import { GET_NOTIFICATION } from 'src/api/notification';
import { LoadingScreen } from 'src/components/loading-screen';
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import EditNotification from '../notifications/edit-notification';

// ----------------------------------------------------------------------

export default function NotificationView() {
  const settings = useSettingsContext();
  const params = useParams();

  const { data, refetch, loading, error } = useQuery(GET_NOTIFICATION, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    notifyOnNetworkStatusChange: true,
    skip: params.id === 'new',
    variables: {
      id: params.id,
    },
  });

  let content = (
    <LoadingScreen
      sx={{
        borderRadius: 1.5,
        bgcolor: 'background.default',
      }}
    />
  );
  if (!loading) {
    if (error) {
      content = (
        <EmptyContent
          title='Error loading Notification'
          description='There was an error loading notification details. Please try again.'
          action={
            <Button variant="soft" onClick={() => refetch()} sx={{ mt: 2 }}>
              Retry
            </Button>
          }
        />
      );
    } else {
      content = <EditNotification currentNotification={data?.notification} />;
    }
  }

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
      {content}
    </Container>
  );
}
