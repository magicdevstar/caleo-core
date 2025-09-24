import { useEffect, useMemo } from 'react';
import { useWatch, useFormContext } from 'react-hook-form';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import { calculateAndFormatHours } from 'src/utils/incidents';
import { RHFRadioGroup, RHFTimePicker } from '../../../components/hook-form';
import { TotalBox } from './total-box';

export enum TimekeepingType {
  PAID = 'PAID',
  SAVED = 'SAVED',
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
  // Our best effort to auto calculate the enrouteToIncident time when they are first filling out the form
  const enrouteToIncidentHasValue = useMemo(() => !!getValues('shiftDetails.enrouteToIncident'), [getValues]);
  const rdoValue = useWatch({ name: 'timekeeping.rdo' });
  const timeIn = useWatch({ name: 'timekeeping.timeIn' });
  const timeOut = useWatch({ name: 'timekeeping.timeOut' });
  const overtimeHoursDisplay = useWatch({ name: 'timekeeping.overtimeHoursDisplay' });
  const straightHoursDisplay = useWatch({ name: 'timekeeping.straightHoursDisplay' });
  const overtimeTimeIn = useWatch({ name: 'timekeeping.overtimeTimeIn' });
  const overtimeTimeOut = useWatch({ name: 'timekeeping.overtimeTimeOut' });

  // Calculate straight hours from timeIn and timeOut
  useEffect(() => {
    if (timeIn && timeOut) {
      const timeInDate = new Date(timeIn);
      const timeOutDate = new Date(timeOut);
      
      // Normalize dates to be within 24 hours while preserving time
      const normalizedTimeIn = new Date(timeInDate);
      const normalizedTimeOut = new Date(timeOutDate);
      
      // If end time is before start time (next day scenario), add a day to end time
      if (normalizedTimeOut.getTime() <= normalizedTimeIn.getTime()) {
        normalizedTimeOut.setDate(normalizedTimeOut.getDate() + 1);
      }
      
      // If the difference is more than 24 hours, adjust the end time to be within 24 hours
      const diffInMs = normalizedTimeOut.getTime() - normalizedTimeIn.getTime();
      const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
      
      if (diffInMs > twentyFourHoursInMs) {
        // Set end time to be on the same day as start time but preserve the time
        normalizedTimeOut.setFullYear(normalizedTimeIn.getFullYear());
        normalizedTimeOut.setMonth(normalizedTimeIn.getMonth());
        normalizedTimeOut.setDate(normalizedTimeIn.getDate());
        
        // If this makes end time before start time, add a day
        if (normalizedTimeOut.getTime() <= normalizedTimeIn.getTime()) {
          normalizedTimeOut.setDate(normalizedTimeOut.getDate() + 1);
        }
        
        // Update the form with normalized dates
        setValue('timekeeping.timeOut', normalizedTimeOut);
      }
      
      const result = calculateAndFormatHours(normalizedTimeIn, normalizedTimeOut);
      setValue('timekeeping.straightHours', result.numeric); // Store numeric for backend
      setValue('timekeeping.straightHoursDisplay', result.formatted); // Store formatted for display
    } else {
      setValue('timekeeping.straightHours', 0);
      setValue('timekeeping.straightHoursDisplay', '0.00');
    }
  }, [timeIn, timeOut, setValue]);

  // Calculate overtime hours from overtimeTimeIn and overtimeTimeOut
  useEffect(() => {
    if (overtimeTimeIn && overtimeTimeOut) {
      const overtimeTimeInDate = new Date(overtimeTimeIn);
      const overtimeTimeOutDate = new Date(overtimeTimeOut);
      
      // Normalize dates to be within 24 hours while preserving time
      const normalizedOvertimeTimeIn = new Date(overtimeTimeInDate);
      const normalizedOvertimeTimeOut = new Date(overtimeTimeOutDate);
      
      // If end time is before start time (next day scenario), add a day to end time
      if (normalizedOvertimeTimeOut.getTime() <= normalizedOvertimeTimeIn.getTime()) {
        normalizedOvertimeTimeOut.setDate(normalizedOvertimeTimeOut.getDate() + 1);
      }
      
      // If the difference is more than 24 hours, adjust the end time to be within 24 hours
      const diffInMs = normalizedOvertimeTimeOut.getTime() - normalizedOvertimeTimeIn.getTime();
      const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
      
      if (diffInMs > twentyFourHoursInMs) {
        // Set end time to be on the same day as start time but preserve the time
        normalizedOvertimeTimeOut.setFullYear(normalizedOvertimeTimeIn.getFullYear());
        normalizedOvertimeTimeOut.setMonth(normalizedOvertimeTimeIn.getMonth());
        normalizedOvertimeTimeOut.setDate(normalizedOvertimeTimeIn.getDate());
        
        // If this makes end time before start time, add a day
        if (normalizedOvertimeTimeOut.getTime() <= normalizedOvertimeTimeIn.getTime()) {
          normalizedOvertimeTimeOut.setDate(normalizedOvertimeTimeOut.getDate() + 1);
        }
        
        // Update the form with normalized dates
        setValue('timekeeping.overtimeTimeOut', normalizedOvertimeTimeOut);
      }
      
      const result = calculateAndFormatHours(normalizedOvertimeTimeIn, normalizedOvertimeTimeOut);
      setValue('timekeeping.overtimeHours', result.numeric); // Store numeric for backend
      setValue('timekeeping.overtimeHoursDisplay', result.formatted); // Store formatted for display
    } else {
      setValue('timekeeping.overtimeHours', 0);
      setValue('timekeeping.overtimeHoursDisplay', '0.00');
    }
  }, [overtimeTimeIn, overtimeTimeOut, setValue]);

  // Set enrouteToIncident to earliest time if not already set
  useEffect(() => {
    // Only set if enrouteToIncident is not already set
    if (!enrouteToIncidentHasValue) {
      const times = [timeIn, overtimeTimeIn].filter((val) => val instanceof Date && !Number.isNaN(val.getTime()));
      const earliestTime = getEarliestTime(times as Date[]);
      if (earliestTime) {
        setValue('timekeeping.minTimeIn', earliestTime);
        setValue('shiftDetails.enrouteToIncident', earliestTime);
      }
    }
  }, [enrouteToIncidentHasValue, timeIn, overtimeTimeIn, setValue, getValues]);
  
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

      {(rdoValue === 'no') && (
        <>
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
          <TotalBox label='Straight Hours' total={straightHoursDisplay} />
        </>
      )}

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
      <TotalBox label='Overtime Hours' total={overtimeHoursDisplay} />
    </Stack>
  );
}
