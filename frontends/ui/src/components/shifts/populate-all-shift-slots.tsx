import { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { useMutation } from '@apollo/client';
import dayjs from 'dayjs';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Toolbar from '@mui/material/Toolbar';
import LoadingButton from '@mui/lab/LoadingButton';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { UPSERT_SHIFTS } from 'src/api/shifts';
import { useSnackbar } from 'src/components/snackbar';
import { useAuthContext } from 'src/auth/hooks';
import { convertDate, useDateFormats, getNow } from 'src/hooks/use-datejs';
import { GET_EVENT } from 'src/api/event';
import { GET_ASSIGNMENT } from 'src/api/assignment';
import { AssignmentSlotDetails } from 'src/__generated__/resolvers-types';
import Iconify from '../iconify';

type ShiftSlot = {
  id: string;
  slotCount: number;
  slotDetails?: AssignmentSlotDetails[];
  startDate?: string | null;
  endDate?: string | null;
};

type AssignmentShiftSlots = {
  assignmentId: string;
  assignmentName?: string;
  shiftSlots: ShiftSlot[];
};

type PopulateAllShiftSlotsProps = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  assignments: AssignmentShiftSlots[];
  onSuccess?: () => void;
};

export default function PopulateAllShiftSlots({
  open,
  onClose,
  eventId,
  assignments,
  onSuccess
}: PopulateAllShiftSlotsProps) {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState<boolean>(false);
  const [bulkStartTime, setBulkStartTime] = useState<dayjs.Dayjs | null>(null);
  const [bulkEndTime, setBulkEndTime] = useState<dayjs.Dayjs | null>(null);
  const { user } = useAuthContext();
  const { dateTimeFormat } = useDateFormats();
  const { enqueueSnackbar } = useSnackbar();
  const [dateRanges, setDateRanges] = useState<{[assignmentId: string]: {[slotId: string]: [dayjs.Dayjs | null, dayjs.Dayjs | null]}}>({}); 
  const [errors, setErrors] = useState<{[assignmentId: string]: {[slotId: string]: string}}>({});

  // Create mapped shift slots for all assignments
  const mappedShiftSlots = useMemo(() => {
    const result: {[assignmentId: string]: Record<string, { locked: boolean, customId?: string, callSign?: string }>} = {};
    
    assignments.forEach(assignment => {
      result[assignment.assignmentId] = (assignment.shiftSlots || []).reduce((acc, slot) => {
        slot.slotDetails?.forEach(details => {
          acc[details.index] = {
            locked: !!details.locked,
            customId: details.customId ? details.customId : undefined,
            callSign: details.callSign ? details.callSign : undefined,
          };
        });
        return acc;
      }, {} as Record<string, { locked: boolean, customId?: string, callSign?: string }>);
    });
    
    return result;
  }, [assignments]);

  // Get all assignment IDs for refetch queries
  const assignmentIds = useMemo(() => assignments.map(a => a.assignmentId), [assignments]);

  // Initialize mutation
  const [updateShiftSlotDates] = useMutation(UPSERT_SHIFTS, {
    refetchQueries: [
      {
        query: GET_EVENT,
        variables: { id: eventId }
      },
      // Refetch all assignments
      ...assignmentIds.map(assignmentId => ({
        query: GET_ASSIGNMENT,
        variables: { id: assignmentId }
      })),
    ],
    // Remove automatic handlers since we handle success/error manually
  });

  // Calculate if form is valid
  const isValid = useMemo(() => {
    if (assignments.length === 0) return false;
    
    // Check if all assignments have valid date ranges for all their slots
    return assignments.every(assignment => {
      if (assignment.shiftSlots.length === 0) return true; // Skip assignments with no slots
      
      return assignment.shiftSlots.every(slot => {
        const range = dateRanges[assignment.assignmentId]?.[slot.id];
        return range?.[0] && range?.[1] && !range[0].isAfter(range[1]);
      });
    });
  }, [assignments, dateRanges]);

  // Initialize date ranges from shift slots with timezone
  useEffect(() => {
    if (assignments && assignments.length > 0 && user?.member?.org?.timezone) {
      const initialRanges: {[assignmentId: string]: {[slotId: string]: [dayjs.Dayjs | null, dayjs.Dayjs | null]}} = {};
      
      assignments.forEach(assignment => {
        initialRanges[assignment.assignmentId] = {};
        
        assignment.shiftSlots.forEach(slot => {
          if (slot.startDate || slot.endDate) {
            // Use existing dates if available
            initialRanges[assignment.assignmentId][slot.id] = [
              slot.startDate ? convertDate({ date: slot.startDate, user }) : null,
              slot.endDate ? convertDate({ date: slot.endDate, user }) : null
            ];
          } else {
            // Initialize with current time and current time + 15 minutes
            const now = getNow({ organization: user.member.org! });
            initialRanges[assignment.assignmentId][slot.id] = [
              now,
              now.add(15, 'minute')
            ];
          }
        });
      });
      
      setDateRanges(initialRanges);
    }
  }, [assignments, user]);

  const handleStartDateTimeChange = useCallback((assignmentId: string, slotId: string, date: dayjs.Dayjs | null) => {
    setDateRanges(prev => {
      const currentAssignmentRanges = prev[assignmentId] || {};
      const currentRange = currentAssignmentRanges[slotId] || [null, null];
      return {
        ...prev,
        [assignmentId]: {
          ...currentAssignmentRanges,
          [slotId]: [date, currentRange[1]]
        }
      };
    });
    
    // Clear error if both dates are set
    if (date && dateRanges[assignmentId]?.[slotId]?.[1]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[assignmentId]) {
          delete newErrors[assignmentId][slotId];
          if (Object.keys(newErrors[assignmentId]).length === 0) {
            delete newErrors[assignmentId];
          }
        }
        return newErrors;
      });
    }
  }, [dateRanges]);

  const handleEndDateTimeChange = useCallback((assignmentId: string, slotId: string, date: dayjs.Dayjs | null) => {
    setDateRanges(prev => {
      const currentAssignmentRanges = prev[assignmentId] || {};
      const currentRange = currentAssignmentRanges[slotId] || [null, null];
      return {
        ...prev,
        [assignmentId]: {
          ...currentAssignmentRanges,
          [slotId]: [currentRange[0], date]
        }
      };
    });
    
    // Clear error if both dates are set
    if (date && dateRanges[assignmentId]?.[slotId]?.[0]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[assignmentId]) {
          delete newErrors[assignmentId][slotId];
          if (Object.keys(newErrors[assignmentId]).length === 0) {
            delete newErrors[assignmentId];
          }
        }
        return newErrors;
      });
    }
  }, [dateRanges]);

  const validateDateRanges = useCallback(() => {
    const newErrors: {[assignmentId: string]: {[slotId: string]: string}} = {};
    
    assignments.forEach(assignment => {
      assignment.shiftSlots.forEach(slot => {
        const range = dateRanges[assignment.assignmentId]?.[slot.id];
        if (!range?.[0] || !range?.[1]) {
          if (!newErrors[assignment.assignmentId]) {
            newErrors[assignment.assignmentId] = {};
          }
          newErrors[assignment.assignmentId][slot.id] = 'Both start and end dates are required';
        } else if (range[0].isAfter(range[1])) {
          if (!newErrors[assignment.assignmentId]) {
            newErrors[assignment.assignmentId] = {};
          }
          newErrors[assignment.assignmentId][slot.id] = 'Start date must be before end date';
        }
      });
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [dateRanges, assignments]);

  // Generate unique slot keys for selection
  const getSlotKey = useCallback((assignmentId: string, slotId: string) => `${assignmentId}-${slotId}`, []);

  // Get all slots for bulk operations
  const allSlots = useMemo(() => {
    const slots: Array<{ assignmentId: string; slotId: string; assignmentName?: string; slotIndex: number }> = [];
    assignments.forEach(assignment => {
      assignment.shiftSlots.forEach((slot, index) => {
        slots.push({
          assignmentId: assignment.assignmentId,
          slotId: slot.id,
          assignmentName: assignment.assignmentName,
          slotIndex: index + 1
        });
      });
    });
    return slots;
  }, [assignments]);

  const handleSlotSelection = useCallback((assignmentId: string, slotId: string, checked: boolean) => {
    const slotKey = getSlotKey(assignmentId, slotId);
    setSelectedSlots(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(slotKey);
      } else {
        newSet.delete(slotKey);
      }
      return newSet;
    });
  }, [getSlotKey]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allSlotKeys = allSlots.map(slot => getSlotKey(slot.assignmentId, slot.slotId));
      setSelectedSlots(new Set(allSlotKeys));
    } else {
      setSelectedSlots(new Set());
    }
  }, [allSlots, getSlotKey]);

  const handleBulkEdit = useCallback(() => {
    setBulkEditMode(true);
    // Initialize bulk times with the first selected slot's times
    if (selectedSlots.size > 0) {
      const firstSlotKey = Array.from(selectedSlots)[0];
      const [assignmentId, slotId] = firstSlotKey.split('-');
      const range = dateRanges[assignmentId]?.[slotId];
      setBulkStartTime(range?.[0] || null);
      setBulkEndTime(range?.[1] || null);
    }
  }, [selectedSlots, dateRanges]);

  const handleApplyBulkEdit = useCallback(() => {
    if (!bulkStartTime || !bulkEndTime) return;

    setDateRanges(prev => {
      const newRanges = { ...prev };
      selectedSlots.forEach(slotKey => {
        const [assignmentId, slotId] = slotKey.split('-');
        if (!newRanges[assignmentId]) {
          newRanges[assignmentId] = {};
        }
        newRanges[assignmentId][slotId] = [bulkStartTime, bulkEndTime];
      });
      return newRanges;
    });

    // Clear errors for updated slots
    setErrors(prev => {
      const newErrors = { ...prev };
      selectedSlots.forEach(slotKey => {
        const [assignmentId, slotId] = slotKey.split('-');
        if (newErrors[assignmentId]?.[slotId]) {
          delete newErrors[assignmentId][slotId];
          if (Object.keys(newErrors[assignmentId]).length === 0) {
            delete newErrors[assignmentId];
          }
        }
      });
      return newErrors;
    });

    setBulkEditMode(false);
    setSelectedSlots(new Set());
  }, [bulkStartTime, bulkEndTime, selectedSlots]);

  const handleCancelBulkEdit = useCallback(() => {
    setBulkEditMode(false);
    setBulkStartTime(null);
    setBulkEndTime(null);
    setSelectedSlots(new Set());
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateDateRanges()) {
      return;
    }

    setSubmitting(true);

    // Create promises for all assignments
    const assignmentPromises = assignments.map(async (assignment) => {
      const formattedSlots = assignment.shiftSlots.map(slot => {
        const start = dateRanges[assignment.assignmentId]?.[slot.id]?.[0];
        const end = dateRanges[assignment.assignmentId]?.[slot.id]?.[1];
        
        return {
          shiftId: uuid(),
          slotCount: slot.slotCount,
          startDate: start ? start.toISOString() : null,
          endDate: end ? end.toISOString() : null
        };
      });

      const assignmentShifts = formattedSlots.map((slot) => 
        new Array(slot.slotCount).fill({
          startTime: slot.startDate,
          endTime: slot.endDate,
          shiftId: slot.shiftId,
          assignmentId: assignment.assignmentId,
          eventId,
        })
      ).flat().map((shift, index) => ({
        ...shift,
        ...mappedShiftSlots[assignment.assignmentId][index],
        ...(mappedShiftSlots[assignment.assignmentId][index]?.locked && { status: 'LOCKED' }),
      }));

      return updateShiftSlotDates({
        variables: {
          input: assignmentShifts,
          removeSlots: true
        }
      });
    });

    // Process all assignments in parallel
    const results = await Promise.allSettled(assignmentPromises);
    
    // Count successes and failures
    let successCount = 0;
    let errorCount = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount += 1;
      } else {
        errorCount += 1;
        const assignment = assignments[index];
        console.error(`Error updating assignment ${assignment.assignmentName || assignment.assignmentId}:`, result.reason);
      }
    });

    // Show summary message
    if (successCount > 0 && errorCount === 0) {
      enqueueSnackbar(`Successfully updated all ${successCount} assignments`);
      onSuccess?.();
      onClose();
    } else if (successCount > 0 && errorCount > 0) {
      enqueueSnackbar(`Updated ${successCount} assignments, ${errorCount} failed`, { variant: 'warning' });
      onSuccess?.();
      onClose();
    } else {
      enqueueSnackbar('Failed to update any assignments', { variant: 'error' });
    }
    setSubmitting(false);
  }, [mappedShiftSlots, validateDateRanges, dateRanges, assignments, updateShiftSlotDates, eventId, enqueueSnackbar, onSuccess, onClose, setSubmitting]);

  const totalSlots = useMemo(() =>
    assignments.reduce((total, assignment) => total + assignment.shiftSlots.length, 0),
  [assignments]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box>
          <Typography gutterBottom variant="h6">Populate All Shift Slots</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            All shift slots have been initialized with current time and a 15-minute duration. You can adjust as needed.
            {assignments.length > 1 && ` Managing ${assignments.length} assignments with ${totalSlots} total shift slots.`}
          </Alert>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {assignments.length === 0 ? (
          <Typography color="text.secondary">No assignments with shift slots to populate</Typography>
        ) : (
          <>
            {/* Bulk Edit Toolbar */}
            {!bulkEditMode && (
              <Toolbar sx={{ px: 0, mb: 2, minHeight: 'auto !important' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedSlots.size === allSlots.length && allSlots.length > 0}
                      indeterminate={selectedSlots.size > 0 && selectedSlots.size < allSlots.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  }
                  label="Select All"
                />
                <Box sx={{ flexGrow: 1 }} />
                {selectedSlots.size > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {selectedSlots.size} slot{selectedSlots.size !== 1 ? 's' : ''} selected
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleBulkEdit}
                      startIcon={<Iconify icon="mdi:clock-edit" />}
                    >
                      Bulk Edit Times
                    </Button>
                  </Box>
                )}
              </Toolbar>
            )}

            {/* Bulk Edit Panel */}
            {bulkEditMode && (
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'background.neutral' }}>
                <Typography variant="h6" gutterBottom>
                  Bulk Edit Times ({selectedSlots.size} slots)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
                  <DateTimePicker
                    ampm={false}
                    timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                    label="Start Date & Time"
                    value={bulkStartTime}
                    onChange={setBulkStartTime}
                    timezone={user?.member?.org?.timezone || undefined}
                    format={dateTimeFormat}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
                  <DateTimePicker
                    ampm={false}
                    timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                    label="End Date & Time"
                    value={bulkEndTime}
                    onChange={setBulkEndTime}
                    timezone={user?.member?.org?.timezone || undefined}
                    format={dateTimeFormat}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleApplyBulkEdit}
                    disabled={!bulkStartTime || !bulkEndTime || (bulkStartTime && bulkEndTime && bulkStartTime.isAfter(bulkEndTime))}
                  >
                    Apply to Selected Slots
                  </Button>
                  <Button variant="outlined" onClick={handleCancelBulkEdit}>
                    Cancel
                  </Button>
                </Box>
              </Paper>
            )}

            <Stack spacing={3} sx={{ mt: 2 }}>
              {assignments.map((assignment, assignmentIndex) => {
                const assignmentRanges = dateRanges[assignment.assignmentId] || {};
                const assignmentErrors = errors[assignment.assignmentId] || {};
                const hasErrors = Object.keys(assignmentErrors).length > 0;
                const completedSlots = assignment.shiftSlots.filter(slot => {
                  const range = assignmentRanges[slot.id];
                  return range?.[0] && range?.[1] && !assignmentErrors[slot.id];
                }).length;
                
                return (
                  <Paper key={assignment.assignmentId} sx={{ p: 0, border: hasErrors ? '1px solid' : 'none', borderColor: hasErrors ? 'error.main' : 'transparent' }}>
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<Iconify icon="mdi:chevron-down" />}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                          <Typography variant="h6">
                            Assignment: {assignment.assignmentName || assignment.assignmentId}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              {completedSlots}/{assignment.shiftSlots.length} slots configured
                            </Typography>
                            {completedSlots === assignment.shiftSlots.length && !hasErrors && (
                              <Typography component="span" color="success.main">
                                ✓
                              </Typography>
                            )}
                            {hasErrors && (
                              <Typography component="span" color="error.main">
                                ⚠
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {assignment.shiftSlots.length === 0 ? (
                          <Typography color="text.secondary">No shift slots to populate for this assignment</Typography>
                        ) : (
                          <Stack spacing={3}>
                            {assignment.shiftSlots.map((slot, slotIndex) => {
                              const range = assignmentRanges[slot.id];
                              const isSlotComplete = range?.[0] && range?.[1];
                              const slotError = assignmentErrors[slot.id];
                              const slotKey = getSlotKey(assignment.assignmentId, slot.id);
                              const isSelected = selectedSlots.has(slotKey);
                              
                              return (
                                <Box key={slot.id}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Checkbox
                                        checked={isSelected}
                                        onChange={(e) => handleSlotSelection(assignment.assignmentId, slot.id, e.target.checked)}
                                        size="small"
                                        disabled={bulkEditMode}
                                      />
                                      <Typography variant="subtitle1">
                                        Shift Slot {slotIndex + 1} ({slot.slotCount} position{slot.slotCount !== 1 ? 's' : ''})
                                        {isSlotComplete && !slotError && (
                                          <Typography component="span" color="success.main" sx={{ ml: 1 }}>
                                            ✓
                                          </Typography>
                                        )}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 1 }}>
                                    <DateTimePicker
                                      ampm={false}
                                      timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                                      label="Start Date & Time"
                                      value={assignmentRanges[slot.id]?.[0]}
                                      onChange={(date) => handleStartDateTimeChange(assignment.assignmentId, slot.id, date)}
                                      timezone={user?.member?.org?.timezone || undefined}
                                      format={dateTimeFormat}
                                      disabled={bulkEditMode}
                                      slotProps={{
                                        textField: {
                                          fullWidth: true,
                                          error: !!slotError || !assignmentRanges[slot.id]?.[0] || (assignmentRanges[slot.id]?.[0] && assignmentRanges[slot.id]?.[1] && assignmentRanges[slot.id]?.[0]!.isAfter(assignmentRanges[slot.id]?.[1]!)) || false,
                                          required: true
                                        }
                                      }}
                                    />
                                    <DateTimePicker
                                      ampm={false}
                                      timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                                      label="End Date & Time"
                                      value={assignmentRanges[slot.id]?.[1]}
                                      onChange={(date) => handleEndDateTimeChange(assignment.assignmentId, slot.id, date)}
                                      timezone={user?.member?.org?.timezone || undefined}
                                      format={dateTimeFormat}
                                      disabled={bulkEditMode}
                                      slotProps={{
                                        textField: {
                                          fullWidth: true,
                                          error: !!slotError || !assignmentRanges[slot.id]?.[1] || (assignmentRanges[slot.id]?.[0] && assignmentRanges[slot.id]?.[1] && assignmentRanges[slot.id]?.[1]!.isBefore(assignmentRanges[slot.id]?.[0]!)) || false,
                                          required: true
                                        }
                                      }}
                                    />
                                  </Box>
                                  
                                  {slotError && (
                                    <Alert severity="error" sx={{ mt: 1 }}>{slotError}</Alert>
                                  )}
                                  
                                  {slotIndex < assignment.shiftSlots.length - 1 && <Divider sx={{ mt: 2 }} />}
                                </Box>
                              );
                            })}
                          </Stack>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  </Paper>
                );
              })}
            </Stack>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <LoadingButton 
          onClick={handleSubmit} 
          loading={submitting} 
          variant="contained"
          disabled={!isValid || totalSlots === 0}
        >
          Save All Changes
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
