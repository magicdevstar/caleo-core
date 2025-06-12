import Stack from '@mui/material/Stack';
import { RHFDatePicker } from '../../../components/hook-form';

export default function OperationalPeriodStep() {
  return (
    <Stack spacing={3}>
      <RHFDatePicker 
        name="operationalPeriod.date" 
        label="Date" 
        textFieldProps={{ fullWidth: true }}
      />
    </Stack>
  );
}
