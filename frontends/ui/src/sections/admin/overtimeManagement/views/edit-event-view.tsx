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
import { GET_EVENT } from 'src/api/event';
import QueryView from 'src/components/query-view';
import { EditEventButtons } from 'src/components/events/edit-event-buttons';
import EditEvent from '../events/edit-event';

// ----------------------------------------------------------------------

export default function EventDetail() {
  const settings = useSettingsContext();
  const params = useParams();
  const shouldSkip = !params.eventId || params.eventId === 'new';


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
        heading="Event Detail"
        hideLinks={loading}
        links={[
          { name: 'Events', href: paths.dashboard.admin.overtime.events },
          {
            name: data?.event?.name || 'Event Detail',
          },
        ]}
        sx={{ mb: 3 }}
        action={(<EditEventButtons event={data?.event} shouldSkip={shouldSkip} error={error} loading={loading} />)}
      />

      <QueryView
        loading={loading}
        error={!!error}
        errorTitle='Failed to Load Event'
        errorDescription='There was an error loading Event details. Please try again.'
        refetch={refetch}
      >
        <EditEvent currentEvent={data?.event} />
      </QueryView>
    </Container>
  );
}
