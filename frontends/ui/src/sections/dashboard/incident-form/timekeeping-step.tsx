import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useWatch } from 'react-hook-form';
import { RHFRadioGroup, RHFTextField, RHFTimePicker } from '../../../components/hook-form';

export default function TimekeepingStep() {
  const rdoValue = useWatch({ name: 'timekeeping.rdo' });
  
  return (
    <Stack spacing={3}>
      <RHFRadioGroup
        name="timekeeping.rdo"
        label="RDO"
        options={[
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ]}
        row
      />
      
      {rdoValue === 'yes' && (
        <RHFTextField 
          name="timekeeping.overtimeHours" 
          label="Overtime Hours"
          type="number"
          InputProps={{ inputProps: { min: 0, step: 0.5 } }}
        />
      )}
      
      {rdoValue === 'no' && (
        <RHFTextField 
          name="timekeeping.straightHours" 
          label="Straight Hours"
          type="number"
          InputProps={{ inputProps: { min: 0, step: 0.5 } }}
        />
      )}
      
      {(rdoValue === 'yes' || rdoValue === 'no') && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <RHFTimePicker
              name="timekeeping.timeIn"
              label="Time In"
              textFieldProps={{ fullWidth: true }}
              ampm={false}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <RHFTimePicker
              name="timekeeping.timeOut"
              label="Time Out"
              textFieldProps={{ fullWidth: true }}
              ampm={false}
            />
          </Grid>
        </Grid>
      )}
    </Stack>
  );
}
