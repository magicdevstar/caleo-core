import { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { useMutation } from '@apollo/client';
import dayjs from 'dayjs';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Stack,
  Alert
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { DateTimePicker } from '@mui/x-date-pickers';

import { UPSERT_SHIFTS } from 'src/api/shifts';
import { useSnackbar } from 'src/components/snackbar';
import { useAuthContext } from 'src/auth/hooks';
import { convertDate, useDateFormats, getNow } from 'src/hooks/use-datejs';
import { GET_EVENT } from 'src/api/event';
import { GET_ASSIGNMENT } from 'src/api/assignment';

type ShiftSlot = {
  id: string;
  slotCount: number;
  startDate?: string | null;
  endDate?: string | null;
};

type PopulateShiftSlotsProps = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  assignmentId: string;
  shiftSlots: ShiftSlot[];
  onSuccess?: () => void;
};

export default function PopulateShiftSlots({
  open,
  onClose,
  eventId,
  assignmentId,
  shiftSlots,
  onSuccess
}: PopulateShiftSlotsProps) {
  const { user } = useAuthContext();
  const { dateTimeFormat } = useDateFormats();
  const { enqueueSnackbar } = useSnackbar();
  const [dateRanges, setDateRanges] = useState<{[key: string]: [dayjs.Dayjs | null, dayjs.Dayjs | null]}>({}); 
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Initialize mutation - create this mutation in your API folder
  const [updateShiftSlotDates, { loading }] = useMutation(UPSERT_SHIFTS, {
    refetchQueries: [
      {
        query: GET_EVENT,
        variables: { id: eventId }
      },
      {
        query: GET_ASSIGNMENT,
        variables: { id: assignmentId }
      },
    ],
    onCompleted: () => {
      enqueueSnackbar('Shift dates updated successfully');
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      enqueueSnackbar(`Error updating shift dates: ${error.message}`, { variant: 'error' });
    }
  });

  // Calculate if form is valid
  const isValid = useMemo(() => {
    if (shiftSlots.length === 0) return false;
    
    // Check if all slots have valid date ranges
    return shiftSlots.every(slot => {
      const range = dateRanges[slot.id];
      return range?.[0] && range?.[1] && !range[0].isAfter(range[1]);
    });
  }, [shiftSlots, dateRanges]);

  // Initialize date ranges from shift slots with timezone
  useEffect(() => {
    if (shiftSlots && shiftSlots.length > 0 && user?.member?.org?.timezone) {
      const initialRanges: {[key: string]: [dayjs.Dayjs | null, dayjs.Dayjs | null]} = {};
      
      shiftSlots.forEach(slot => {
        if (slot.startDate || slot.endDate) {
          // Use existing dates if available
          initialRanges[slot.id] = [
            slot.startDate ? convertDate({ date: slot.startDate, user }) : null,
            slot.endDate ? convertDate({ date: slot.endDate, user }) : null
          ];
        } else {
          // Initialize with current time and current time + 15 minutes
          const now = getNow({ organization: user.member.org! });
          initialRanges[slot.id] = [
            now,
            now.add(15, 'minute')
          ];
        }
      });
      
      setDateRanges(initialRanges);
    }
  }, [shiftSlots, user]);

  const handleStartDateTimeChange = useCallback((slotId: string, date: dayjs.Dayjs | null) => {
    setDateRanges(prev => {
      const currentRange = prev[slotId] || [null, null];
      return {
        ...prev,
        [slotId]: [date, currentRange[1]]
      };
    });
    
    // Clear error if both dates are set
    if (date && dateRanges[slotId]?.[1]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[slotId];
        return newErrors;
      });
    }
  }, [dateRanges]);

  const handleEndDateTimeChange = useCallback((slotId: string, date: dayjs.Dayjs | null) => {
    setDateRanges(prev => {
      const currentRange = prev[slotId] || [null, null];
      return {
        ...prev,
        [slotId]: [currentRange[0], date]
      };
    });
    
    // Clear error if both dates are set
    if (date && dateRanges[slotId]?.[0]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[slotId];
        return newErrors;
      });
    }
  }, [dateRanges]);

  const validateDateRanges = useCallback(() => {
    const newErrors: {[key: string]: string} = {};
    
    shiftSlots.forEach(slot => {
      const range = dateRanges[slot.id];
      if (!range?.[0] || !range?.[1]) {
        newErrors[slot.id] = 'Both start and end dates are required';
      } else if (range[0].isAfter(range[1])) {
        newErrors[slot.id] = 'Start date must be before end date';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [dateRanges, shiftSlots]);

  const handleSubmit = useCallback(async () => {
    if (!validateDateRanges()) {
      return;
    }

    const formattedSlots = shiftSlots.map(slot => {
      const start = dateRanges[slot.id]?.[0];
      const end = dateRanges[slot.id]?.[1];
      
      return {
        shiftId: uuid(),
        slotCount: slot.slotCount,
        startDate: start ? start.toISOString() : null,
        endDate: end ? end.toISOString() : null
      };
    });

    await updateShiftSlotDates({
      variables: {
        input: formattedSlots.map((slot) => new Array(slot.slotCount).fill({
          startTime: slot.startDate,
          endTime: slot.endDate,
          shiftId: slot.shiftId,
          assignmentId,
          eventId,
        })).flat(),
        removeSlots: true
      }
    });
  }, [validateDateRanges, dateRanges, shiftSlots, updateShiftSlotDates, eventId, assignmentId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box>
          <Typography gutterBottom variant="h6">Populate Shift Slots</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            All shift slots have been initialized with current time and a 15-minute duration. You can adjust as needed.
          </Alert>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {shiftSlots.length === 0 ? (
          <Typography color="text.secondary">No shift slots to populate</Typography>
        ) : (
          <Stack spacing={3} sx={{ mt: 2 }}>
            {shiftSlots.map((slot, index) => {
              const range = dateRanges[slot.id];
              const isSlotComplete = range?.[0] && range?.[1];
              
              return (
                <Box key={slot.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1">
                      Shift Slot {index + 1} ({slot.slotCount} position{slot.slotCount !== 1 ? 's' : ''})
                      {isSlotComplete && !errors[slot.id] && (
                        <Typography component="span" color="success.main" sx={{ ml: 1 }}>
                          ✓
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 1 }}>
                    <DateTimePicker
                      ampm={false}
                      timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                      label="Start Date & Time"
                      value={dateRanges[slot.id]?.[0]}
                      onChange={(date) => handleStartDateTimeChange(slot.id, date)}
                      timezone={user?.member?.org?.timezone || undefined}
                      format={dateTimeFormat}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors[slot.id] || !dateRanges[slot.id]?.[0],
                          required: true
                        }
                      }}
                    />
                    <DateTimePicker
                      ampm={false}
                      timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                      label="End Date & Time"
                      value={dateRanges[slot.id]?.[1]}
                      onChange={(date) => handleEndDateTimeChange(slot.id, date)}
                      timezone={user?.member?.org?.timezone || undefined}
                      format={dateTimeFormat}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors[slot.id] || !dateRanges[slot.id]?.[1],
                          required: true
                        }
                      }}
                    />
                  </Box>
                  
                  {errors[slot.id] && (
                    <Alert severity="error" sx={{ mt: 1 }}>{errors[slot.id]}</Alert>
                  )}
                  
                  {index < shiftSlots.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <LoadingButton 
          onClick={handleSubmit} 
          loading={loading} 
          variant="contained"
          disabled={!isValid || shiftSlots.length === 0}
        >
          Save Changes
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}