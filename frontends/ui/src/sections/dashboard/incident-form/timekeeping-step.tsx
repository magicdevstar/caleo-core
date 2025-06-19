import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import { useWatch, useFormContext } from 'react-hook-form';
import { useEffect } from 'react';
import { RHFRadioGroup, RHFTextField, RHFTimePicker } from '../../../components/hook-form';

export enum TimekeepingType {
  PAID = 'PAID',
  SAVED = 'SAVED',
};

// Helper function to round up to nearest 15 minutes and format as hours:minutes
const calculateAndFormatHours = (startTime: Date, endTime: Date) => {
  const diffInMs = endTime.getTime() - startTime.getTime();
  const diffInMinutes = Math.max(0, diffInMs / (1000 * 60));
  
  // Round up to nearest 15 minutes
  const roundedMinutes = Math.ceil(diffInMinutes / 15) * 15;
  
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  
  return {
    numeric: roundedMinutes / 60, // For form validation/submission
    formatted: `${hours}:${minutes.toString().padStart(2, '0')}` // For display
  };
};

export const getEarliestTime = (times: Date[]) => {
  if (times.length > 0) {
    // Find the earliest time
    return times.reduce((earliest, current) => {
      const earliestDate = new Date(earliest);
      const currentDate = new Date(current);
      return currentDate < earliestDate ? current : earliest;
    });
  }
  return null;
};

export default function TimekeepingStep() {
  const { setValue, getValues } = useFormContext();
  const rdoValue = useWatch({ name: 'timekeeping.rdo' });
  const timeIn = useWatch({ name: 'timekeeping.timeIn' });
  const timeOut = useWatch({ name: 'timekeeping.timeOut' });
  const overtimeTimeIn = useWatch({ name: 'timekeeping.overtimeTimeIn' });
  const overtimeTimeOut = useWatch({ name: 'timekeeping.overtimeTimeOut' });

  // Calculate straight hours from timeIn and timeOut
  useEffect(() => {
    if (timeIn && timeOut) {
      const timeInDate = new Date(timeIn);
      const timeOutDate = new Date(timeOut);
      const result = calculateAndFormatHours(timeInDate, timeOutDate);
      setValue('timekeeping.straightHours', result.numeric); // Store numeric for backend
      setValue('timekeeping.straightHoursDisplay', result.formatted); // Store formatted for display
    } else {
      setValue('timekeeping.straightHours', 0);
      setValue('timekeeping.straightHoursDisplay', '0:00');
    }
  }, [timeIn, timeOut, setValue]);

  // Calculate overtime hours from overtimeTimeIn and overtimeTimeOut
  useEffect(() => {
    if (overtimeTimeIn && overtimeTimeOut) {
      const overtimeTimeInDate = new Date(overtimeTimeIn);
      const overtimeTimeOutDate = new Date(overtimeTimeOut);
      const result = calculateAndFormatHours(overtimeTimeInDate, overtimeTimeOutDate);
      setValue('timekeeping.overtimeHours', result.numeric); // Store numeric for backend
      setValue('timekeeping.overtimeHoursDisplay', result.formatted); // Store formatted for display
    } else {
      setValue('timekeeping.overtimeHours', 0);
      setValue('timekeeping.overtimeHoursDisplay', '0:00');
    }
  }, [overtimeTimeIn, overtimeTimeOut, setValue]);

  // Set enrouteToIncident to earliest time if not already set
  useEffect(() => {
    const currentEnrouteToIncident = getValues('shiftDetails.enrouteToIncident');
    
    // Only set if enrouteToIncident is not already set
    if (!currentEnrouteToIncident) {
      const times = [timeIn, overtimeTimeIn].filter(Boolean);
      const earliestTime = getEarliestTime(times as Date[]);
      if (earliestTime) {
        setValue('timekeeping.minTimeIn', earliestTime);
        setValue('shiftDetails.enrouteToIncident', earliestTime);
      }
    }
  }, [timeIn, overtimeTimeIn, setValue, getValues]);
  
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

      <RHFRadioGroup
        name="timekeeping.type"
        label="Paid or Saved"
        options={[
          { label: 'Paid', value: TimekeepingType.PAID },
          { label: 'Saved', value: TimekeepingType.SAVED },
        ]}
        row
      />
      
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
      <RHFTextField 
        name="timekeeping.straightHoursDisplay"
        disabled
        label="Straight Hours"
        type="text"
        placeholder="0:00"
      />

      {(rdoValue === 'no') && (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <RHFTimePicker
                name="timekeeping.overtimeTimeIn"
                label="Overtime Time In"
                textFieldProps={{ fullWidth: true }}
                ampm={false}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <RHFTimePicker
                name="timekeeping.overtimeTimeOut"
                label="Overtime Time Out"
                textFieldProps={{ fullWidth: true }}
                ampm={false}
              />
            </Grid>
          </Grid>
          <RHFTextField 
            name="timekeeping.overtimeHoursDisplay"
            disabled
            label="Overtime Hours"
            type="text"
            placeholder="0:00"
          />
        </>
      )}
    </Stack>
  );
}
