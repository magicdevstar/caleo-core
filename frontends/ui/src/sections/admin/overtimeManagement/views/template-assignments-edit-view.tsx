import { useSnackbar } from 'notistack';
// @apollo/client
import { useMutation, useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
import LoadingButton from '@mui/lab/LoadingButton';
// hooks
import { useParams, useRouter } from 'src/routes/hooks';
// types
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { GET_ASSIGNMENT } from 'src/api/assignment';
import QueryView from 'src/components/query-view/query-view';
import { CLONE_EVENT_BY_ID } from 'src/api/event';
import Iconify from 'src/components/iconify';
import EditAssignment from '../events/edit-assignment';

// ----------------------------------------------------------------------

export default function TemplateAssignmentsEditView() {
  const { enqueueSnackbar } = useSnackbar();
  const settings = useSettingsContext();
  const params = useParams();
  const router = useRouter();

  const [cloneEvent, { loading: cloneLoading }] = useMutation(CLONE_EVENT_BY_ID, {
    onError() {
      enqueueSnackbar('Failed to create event. Please try again.', { variant: 'error', autoHideDuration: 2000 });
    },
    onCompleted(data) {
      const eventId = data?.cloneEvent?.id;
      if (eventId) {
        router.push(paths.dashboard.admin.overtime.eventDetail.replace(':eventId', eventId));
      }
    },
  });

  const { data, refetch, loading, error } = useQuery(GET_ASSIGNMENT, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      id: params.assignmentId,
    },
    skip: !params.assignmentId || params.assignmentId === 'new',
  });

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Assignment Detail"
        hideLinks={loading}
        action={
          <LoadingButton
            variant="contained"
            onClick={() => cloneEvent({ variables: { id: params.eventId } })}
            loading={cloneLoading}
            startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
          >Create Event</LoadingButton>
        }
        links={[
          { name: 'Events', href: paths.dashboard.admin.overtime.templates.events },
          {
            name: data?.assignment?.event?.name || 'Event Detail',
            href: paths.dashboard.admin.overtime.templates.eventDetail.replace(':eventId', params?.eventId || ''),
          },
          {
            name: data?.assignment?.name || 'Assignment Detail',
          },
        ]}
        sx={{ mb: 3 }}
      />

      <QueryView
        loading={loading}
        error={!!error}
        errorTitle='Failed to Load Assignment Template Details'
        errorDescription='There was an error loading Assignment template details. Please try again.'
        refetch={refetch}
      >
        <EditAssignment
          assignmentTemplateView
          eventId={params.eventId!}
          currentAssignment={data?.assignment}
        />
      </QueryView>
    </Container>
  );
}
