// @mui
import Container from '@mui/material/Container';
// hooks
import { useQuery } from '@apollo/client';
import { useParams } from 'src/routes/hooks';
// components
import QueryView from 'src/components/query-view';
// types
import { GET_EVENT } from 'src/api/event';
import EventKiosk from '../event/event-kiosk';

export default function EventKioskView() {
  const params = useParams();

  const { data, refetch, loading, error } = useQuery(GET_EVENT, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      id: params.eventId,
    },
  });

  return (
    <Container
      maxWidth="sm"
      component="main"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <QueryView
        loading={loading}
        error={!!error}
        errorTitle='Failed to Load Event'
        errorDescription='There was an error loading Event details. Please try again.'
        refetch={refetch}
      >
        <EventKiosk event={data?.event} eventId={params.eventId!} />
      </QueryView>
    </Container>
  )
}
