import { Stack, Typography } from '@mui/material';

// components
import { RHFOutsideUsersSelect } from 'src/components/hook-form/rhf-outside-users-select';

export default function SelectReviewerStep() {
  return (
    <Stack spacing={3}>
      <Typography variant="subtitle1">Select a reviewer for this incident report</Typography>
      
      <RHFOutsideUsersSelect
        name="reviewer"
        label="Reviewer"
        helperText="Select the person who will review this incident report"
      />
    </Stack>
  );
}
