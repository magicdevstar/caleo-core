import { Stack } from '@mui/material';
import { GET_OUTSIDE_USERS } from 'src/api/outsideUser';

// components
import { RHFGQLSearchAutocomplete } from 'src/components/hook-form';

export default function SelectReviewerStep() {
  return (
    <Stack spacing={3}>
      <RHFGQLSearchAutocomplete
        name="reviewer"
        label="Reviewer/Approver"
        placeholder='Type here to search'
        hideBeforeTyping
        query={GET_OUTSIDE_USERS}
        responseKey='outsideUsers'
        inputLabelProps={{ shrink: true }}
      />
    </Stack>
  );
}
