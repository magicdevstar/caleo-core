import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';
// Types
import { EventStatus, MemberStatus } from 'src/__generated__/resolvers-types';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// components
import FormProvider, { RHFDateRangePicker, RHFGQLSearchAutocomplete } from 'src/components/hook-form';
import { GET_ALL_EVENTS_SLIM } from 'src/api/event';
import { GET_USERS_SLIM } from 'src/api/user';
import { useIncidentSummary } from 'src/hooks/use-incident-summary';

const schema = Yup.object().shape({
  event: Yup.object().required('You must select an incident'),
  dateRange: Yup.array().nullable(),
  user: Yup.object().nullable(),
});

const defaultValues = {
  dateRange: [null, null],
  event: null,
  user: null,
} as any;

export function IncidentReimbursementReport() {
  const { user } = useAuthContext();
  const { downloadSummary } = useIncidentSummary();

  const methods = useForm({
    mode: 'onTouched',
    resolver: yupResolver(schema),
    defaultValues,
  });
  
  const onSubmit = methods.handleSubmit(downloadSummary);

  return (
    <Card
      sx={{
        p: 3,
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Search Criteria
        </Typography>
        <Box
          display="grid"
          rowGap={3}
          columnGap={2}
          sx={{
            mb: 4,
          }}
          gridTemplateColumns={{
            sm: 'repeat(1, 1fr)',
            lg: '1fr 33.3% 33.3%',
          }}
        >
          <RHFGQLSearchAutocomplete
            name="event"
            label="Incident *"
            query={GET_ALL_EVENTS_SLIM}
            responseKey='events'
            filters={{
              status: EventStatus.Incident,
            }}
          />

          <RHFDateRangePicker
            sx={{ width: '100%' }}
            name="dateRange"
            label="Date Range"
            calendars={1}
            timezone={user?.member?.org?.timezone}
          />

          <RHFGQLSearchAutocomplete
            name="user"
            label="Officer"
            query={GET_USERS_SLIM}
            responseKey='users'
            filters={{
              statuses: [MemberStatus.Active],
            }}
          />
        </Box>
        <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
          <LoadingButton type="submit" variant="contained" loading={methods.formState.isSubmitting}>
            Create Report
          </LoadingButton>
        </Stack>
      </FormProvider>
    </Card>
  );
};
