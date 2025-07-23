import { useEffect, useState } from 'react';
// @mui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import { AssignmentShiftSlot, AssignmentSlotDetails } from 'src/__generated__/resolvers-types';
import { useFeatures } from 'src/hooks/use-features';

interface Props {
  editingIndex?: number | null;
  editingSlot?: AssignmentShiftSlot;
  slotModelOpen: boolean;
  isSupervisorAssignment: boolean;
  handleCloseSlotModal: () => void;
  handleSaveSlot: (details: AssignmentShiftSlot, editingIndex?: number | null) => void;
}

export default function AssignmentShiftSlotDialog({
  editingIndex,
  editingSlot,
  slotModelOpen,
  isSupervisorAssignment,
  handleCloseSlotModal,
  handleSaveSlot
}: Props) {
  const { lasdEventFields, customizableShiftId } = useFeatures();
  const [slotCount, setSlotCount] = useState<number>(1);
  const [slotDetails, setSlotDetails] = useState<AssignmentSlotDetails[]>([]);

  useEffect(() => {
    if (editingSlot) {
      setSlotCount(editingSlot.slotCount || 1);
      setSlotDetails((editingSlot.slotDetails || []).filter(Boolean) as AssignmentSlotDetails[]);
    } else {
      setSlotCount(1);
      setSlotDetails([]);
    }
  }, [editingSlot]);

  // Update slot details when slot count changes
  useEffect(() => {
    setSlotDetails((existing) => Array.from({ length: slotCount }, (_, index) => {
      const existingDetail = existing.find(detail => detail.index === index);
      return existingDetail || {
        index,
        callSign: '',
        customId: '',
        locked: false,
      } as AssignmentSlotDetails;
    }));
  }, [slotCount]);

  const updateSlotDetail = (index: number, field: keyof AssignmentSlotDetails, value: any) => {
    setSlotDetails(prev => 
      prev.map(detail => 
        detail.index === index 
          ? { ...detail, [field]: value }
          : detail
      )
    );
  };

  const handleSave = () => {
    const shiftSlot: AssignmentShiftSlot = {
      slotCount,
      slotDetails: slotDetails.map(detail => ({
        ...detail,
        callSign: detail.callSign || null,
        customId: detail.customId || null,
      }))
    };
    handleSaveSlot(shiftSlot, editingIndex);
  };

  return (
    <Dialog fullWidth maxWidth="md" open={slotModelOpen} onClose={handleCloseSlotModal}>
      <DialogTitle>{editingIndex !== null ? 'Edit Shift Slot' : 'Add Shift Slot'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Total Shifts"
          type="number"
          disabled={isSupervisorAssignment}
          fullWidth
          value={slotCount}
          onChange={(e) => setSlotCount(Number(e.target.value))}
          inputProps={{ min: 1 }}
          sx={{ mt: 2, minWidth: 300 }}
        />
        
        {slotCount > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Shift Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {slotDetails.map((detail, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                  Shift {index + 1}
                </Typography>
                
                {
                  (lasdEventFields || customizableShiftId) && (
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      {
                        lasdEventFields && (
                          <TextField
                            label="Call Sign"
                            value={detail.callSign || ''}
                            onChange={(e) => updateSlotDetail(index, 'callSign', e.target.value)}
                            size="small"
                            sx={{ flex: 1 }}
                          />
                        )
                      }
                      {
                        customizableShiftId && (
                          <TextField
                            label="Custom ID"
                            value={detail.customId || ''}
                            onChange={(e) => updateSlotDetail(index, 'customId', e.target.value)}
                            size="small"
                            sx={{ flex: 1 }}
                          />
                        )
                      }
                    </Box>
                  )
                }
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={detail.locked || false}
                      onChange={(e) => updateSlotDetail(index, 'locked', e.target.checked)}
                    />
                  }
                  label="Locked"
                />
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseSlotModal}>Cancel</Button>
        <Button variant='contained' onClick={handleSave} color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  )
}