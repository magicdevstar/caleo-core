import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import Stack from '@mui/material/Stack';
import { Event, IncidentForm } from 'src/__generated__/resolvers-types';
import { RHFDatePicker } from '../../../components/hook-form';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function OperationalPeriodStep({
  event,
  inputSubmission,
}: {
  event: Event,
  inputSubmission?: IncidentForm,
}) {
  return (
    <Stack spacing={3}>
      <RHFDatePicker
        disabled={!!inputSubmission} 
        name="operationalPeriod.date" 
        label="Date"
        minDate={event.startTime ? dayjs(event.startTime) : undefined}
        maxDate={event.endTime ? dayjs(event.endTime) : undefined}
        textFieldProps={{ fullWidth: true }}
      />
    </Stack>
  );
}
