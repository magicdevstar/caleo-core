import { useMemo } from 'react';
import { useQueryParam } from 'use-query-params';
import { Container } from '@mui/material';
import { useParams } from 'react-router';
import { useQuery } from '@apollo/client';
import { GET_EVENT } from 'src/api/event';
import { GET_INCIDENT_SUBMISSION } from 'src/api/incidentForm';
import { useAuthContext } from 'src/auth/hooks';
import QueryView from 'src/components/query-view';
import { Event, IncidentForm as IIncidentForm } from 'src/__generated__/resolvers-types';

import IncidentFormStepper from './incident-form-stepper';
import { NotSkilled } from './not-skilled';

export default function IncidentForm() {
  const params = useParams();
  const [submissionId] = useQueryParam('submissionId');
  const { user } = useAuthContext();
  const { data, refetch, loading, error } = useQuery(GET_EVENT, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      id: params.id,
    },
  });
  const { data: submissionData, loading: submissionLoading } = useQuery<{incidentForm: IIncidentForm}>(GET_INCIDENT_SUBMISSION, {
    variables: {
      id: submissionId,
    },
    skip: !submissionId,
  });

  const hasRequiredSkills = useMemo(() => {
    const event = data?.event as Event;
    if (!event) return false;
    
    // Get user's skill IDs
    const userSkillIds = user?.member?.memberSkills
      ?.filter(memberSkill => memberSkill?.status === 'APPROVED')
      ?.map(memberSkill => memberSkill?.skillId)
      ?.filter(Boolean) || [];


    const requiredSkillIds = event?.requiredSkills?.map(skill => skill?.id).filter(Boolean) || [];

    // If no skills are required, event is open to all users
    if (requiredSkillIds.length === 0) {
      return true;
    }
    
    // Check if user has all required skills
    return requiredSkillIds.every(requiredSkillId => 
      userSkillIds.includes(requiredSkillId)
    );
  }, [user, data]);

  return (
    <Container>
      <QueryView
        loading={loading || submissionLoading}
        error={!!error}
        errorTitle='Failed to Load Event'
        errorDescription='There was an error loading Event details. Please try again.'
        refetch={refetch}
      >
        {
          hasRequiredSkills ? (
            <IncidentFormStepper event={data?.event} inputSubmission={submissionData?.incidentForm} />
          ) : (
            <NotSkilled />
          )
        }
      </QueryView>
    </Container>
  );
}
