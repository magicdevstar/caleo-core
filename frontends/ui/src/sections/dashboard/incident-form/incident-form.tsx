import { Container } from '@mui/material';
import { useParams } from 'react-router';
import { useQuery } from '@apollo/client';
import { GET_EVENT } from 'src/api/event';
import QueryView from 'src/components/query-view';

import IncidentFormStepper from './incident-form-stepper';

export default function IncidentForm() {
  const params = useParams();
  const { data, refetch, loading, error } = useQuery(GET_EVENT, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      id: params.id,
    },
  });
  return (
    <Container>
      <QueryView
        loading={loading}
        error={!!error}
        errorTitle='Failed to Load Event'
        errorDescription='There was an error loading Event details. Please try again.'
        refetch={refetch}
      >
        <IncidentFormStepper event={data?.event} />
      </QueryView>
    </Container>
  );
}
