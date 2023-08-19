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
import { LoadingScreen } from 'src/components/loading-screen';
import { GET_ASSIGNMENT } from 'src/api/assignment';
import EditAssignment from '../events/edit-assignment';

// ----------------------------------------------------------------------

export default function AssignmentDetail() {
  const settings = useSettingsContext();
  const params = useParams();

  const { data, loading } = useQuery(GET_ASSIGNMENT, {
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

      {
        loading ? (
          <LoadingScreen
            sx={{
              borderRadius: 1.5,
              bgcolor: 'background.default',
            }}
          />
        ) : (
          <EditAssignment eventId={params.eventId!} currentAssignment={data?.assignment} />
        )
      }
    </Container>
  );
}
