import dayjs from 'dayjs';
import { useWatch, useFormContext } from 'react-hook-form';
import { useEffect } from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import { RHFTimePicker } from '../../../components/hook-form';

export default function ShiftDetailsStep() {
  const minTimeIn = useWatch({ name: 'timekeeping.minTimeIn' });
  const { setValue } = useFormContext();

  // Calculate 18-hour time when enroute time changes
  useEffect(() => {
    if (minTimeIn) {
      const baseTime = dayjs(minTimeIn);
      const time18Hour = baseTime.add(18, 'hour');
      setValue('shiftDetails.time18Hour', time18Hour.toDate());
    } else {
      setValue('shiftDetails.time18Hour', null);
    }
  }, [minTimeIn, setValue]);
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <RHFTimePicker
            name="shiftDetails.enrouteToIncident"
            label="Enroute to Incident"
            minTime={minTimeIn ? dayjs(minTimeIn) : null}
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
            disabled
            textFieldProps={{ fullWidth: true }}
            format="HH:mm"
            ampm={false}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
