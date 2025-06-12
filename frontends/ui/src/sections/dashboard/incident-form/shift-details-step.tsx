import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import { RHFTimePicker } from '../../../components/hook-form';

export default function ShiftDetailsStep() {
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <RHFTimePicker
            name="shiftDetails.enrouteToIncident"
            label="Enroute to Incident"
            textFieldProps={{ fullWidth: true }}
            format="HH:mm"
            ampm={false}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RHFTimePicker
            name="shiftDetails.staging1097"
            label="Staging (10-97)"
            textFieldProps={{ fullWidth: true }}
            format="HH:mm"
            ampm={false}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RHFTimePicker
            name="shiftDetails.staging1098"
            label="Staging (10-98)"
            textFieldProps={{ fullWidth: true }}
            format="HH:mm"
            ampm={false}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RHFTimePicker
            name="shiftDetails.arrivalAtUOA"
            label="Arrival at UOA"
            textFieldProps={{ fullWidth: true }}
            format="HH:mm"
            ampm={false}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RHFTimePicker
            name="shiftDetails.time18Hour"
            label="18-hour Time"
            textFieldProps={{ fullWidth: true }}
            format="HH:mm"
            ampm={false}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
