import { Stack, Typography } from '@mui/material';
import { GET_OUTSIDE_USERS } from 'src/api/outsideUser';

// components
import { RHFGQLSearchAutocomplete } from 'src/components/hook-form';

export default function SelectReviewerStep() {
  return (
    <Stack spacing={3}>
      <Typography variant="subtitle1">Select a reviewer for this incident report</Typography>
      
      <RHFGQLSearchAutocomplete
        name="reviewer"
        label="Reviewer"
        query={GET_OUTSIDE_USERS}
        responseKey='outsideUsers'
      />
    </Stack>
  );
}
