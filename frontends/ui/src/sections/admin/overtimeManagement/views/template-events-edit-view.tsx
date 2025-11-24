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
import { CLONE_EVENT_BY_ID, GET_EVENT } from 'src/api/event';
import QueryView from 'src/components/query-view';
import Iconify from 'src/components/iconify';
import EditEvent from '../events/event/edit';

// ----------------------------------------------------------------------

export default function TemplateEventsEditView() {
  const { enqueueSnackbar } = useSnackbar();
  const settings = useSettingsContext();
  const params = useParams();
  const router = useRouter();
  const shouldSkip = !params.eventId || params.eventId === 'new';

  const [cloneEvent, { loading: cloneLoading }] = useMutation(CLONE_EVENT_BY_ID, {
    onError: () => {
      enqueueSnackbar('Failed to create event. Please try again.', { variant: 'error', autoHideDuration: 2000 });
    },
    onCompleted: (data) => {
      const eventId = data?.cloneEvent?.id;
      if (eventId) {
        router.push(paths.dashboard.admin.overtime.eventDetail.replace(':eventId', eventId));
      }
    },
  });

  const { data, refetch, loading, error } = useQuery(GET_EVENT, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      id: params.eventId,
    },
    skip: shouldSkip,
  });

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Event Template Detail"
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
          { name: 'Event Templates', href: paths.dashboard.admin.overtime.templates.events },
          {
            name: data?.event?.name || 'Event Template Detail',
          },
        ]}
        sx={{ mb: 3 }}
      />

      <QueryView
        loading={loading}
        error={!!error}
        errorTitle='Failed to Load Event Template'
        errorDescription='There was an error loading Event template details. Please try again.'
        refetch={refetch}
      >
        <EditEvent currentEvent={data?.event} eventTemplateView />
      </QueryView>
    </Container>
  );
}
