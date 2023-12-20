// @apollo/client
import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
// hooks
import { useParams } from 'src/routes/hooks';
// types
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { GET_ASSIGNMENT } from 'src/api/assignment';
import QueryView from 'src/components/query-view/query-view';
import EditAssignment from '../events/edit-assignment';

// ----------------------------------------------------------------------

export default function AssignmentDetail() {
  const settings = useSettingsContext();
  const params = useParams();

  const { data, refetch, loading, error } = useQuery(GET_ASSIGNMENT, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    notifyOnNetworkStatusChange: true,
    variables: {
      id: params.assignmentId,
    },
    skip: !params.assignmentId || params.assignmentId === 'new',
  });

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Event Detail"
        links={[
          { name: 'Events', href: paths.dashboard.admin.overtime.events },
          {
            name: 'Event Detail',
            href: paths.dashboard.admin.overtime.eventDetail.replace(':eventId', params?.eventId || ''),
          },
          {
            name: 'Assignment Detail',
          },
        ]}
        sx={{ mb: 1 }}
      />

      <QueryView
        loading={loading}
        error={!!error}
        errorTitle='Failed to Load Assignment'
        errorDescription='There was an error loading Assignment details. Please try again.'
        onRetry={refetch}
      >
        <EditAssignment eventId={params.eventId!} currentAssignment={data?.assignment} />
      </QueryView>
    </Container>
  );
}
