import { useMemo, useState, useCallback } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
// components
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import Iconify from 'src/components/iconify/iconify';
import { TableConfig } from 'src/components/table/table-config';
import GQLTable from 'src/components/table/gql/table';
import { GET_ALL_SHIFTS } from 'src/api/shifts';

// ----------------------------------------------------------------------

type SlotData = {
  slotCount: number;
  id?: string; // Optional ID for existing entries
};

type Props = {
  name: string;
  isSupervisorAssignment: boolean;
  allDisabled: boolean;
  isComplete: boolean;
};

export default function RHFAssignmentShiftSlots({
  name,
  isSupervisorAssignment,
  allDisabled,
  isComplete,
}: Props) {
  const { control } = useFormContext();
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [slotCount, setSlotCount] = useState<number>(1);
  const deleteConfirm = useBoolean();
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  
  // Use react-hook-form's useFieldArray to handle the slots array
  const { fields, append, update, remove } = useFieldArray({
    control,
    name,
  });

  const handleOpenSlotModal = () => {
    setEditingIndex(null);
    setSlotCount(1);
    setSlotModalOpen(true);
  };

  const handleEditSlot = useCallback((index: number) => {
    const slot = fields[index] as SlotData;
    setEditingIndex(index);
    setSlotCount(slot.slotCount);
    setSlotModalOpen(true);
  }, [fields]);

  const handleCloseSlotModal = () => {
    setSlotModalOpen(false);
  };

  const handleSaveSlot = () => {
    if (slotCount <= 0) {
      return;
    }

    if (editingIndex !== null) {
      // Update existing slot
      update(editingIndex, { slotCount });
    } else {
      // Add new slot
      append({ slotCount });
    }
    
    setSlotModalOpen(false);
  };

  const openDeleteConfirm = useCallback((index: number) => {
    setDeleteIndex(index);
    deleteConfirm.onTrue();
  }, [deleteConfirm]);

  const handleDeleteSlot = useCallback(() => {
    if (deleteIndex !== null) {
      remove(deleteIndex);
      deleteConfirm.onFalse();
    }
  }, [deleteConfirm, deleteIndex, remove]);

  // Transform the field data to match the expected GQLTable format
  const slotsData = useMemo(() => 
    fields.map((field, index) => ({
      id: field.id,
      index, // Store the index for actions
      slotCount: (field as SlotData).slotCount,
    })),
  [fields]);

  const config: TableConfig<any> = useMemo(() => ({
    header: {
      title: 'Shift Slots',
      button: {
        text: 'Add Slot',
        icon: 'ic:baseline-add',
        disabled: allDisabled || isComplete || (isSupervisorAssignment && fields.length >= 1),
        onClick: handleOpenSlotModal,
        tooltip: (isSupervisorAssignment && fields.length >= 1) 
          ? "Supervisor assignments can only have one shift slot" 
          : undefined
      }
    },
    table: {
      sx: {
        minWidth: 'inherit',
      }
    },
    search: {
      data: slotsData as any,
      query: GET_ALL_SHIFTS,
      processResult: (data: any) => ({
        total: data.length,
        items: data,
      }),
    },
    rowActions: [
      {
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        getDisabled: () => allDisabled || isComplete,
        onClick: (row: any) => {
          handleEditSlot(row.index);
        },
      },
      {
        getName: () => 'Delete',
        getDisabled: () => allDisabled || isComplete,
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (row: any) => {
          openDeleteConfirm(row.index);
        },
      }
    ],
    columns: [
      { id: 'slotCount', label: 'Total Shifts', columnType: 'string', width: '90%' },
      { id: '', width: '10%', columnType: 'action', label: '' },
    ],
    filters: []
    }), [allDisabled, handleEditSlot, isComplete, openDeleteConfirm, slotsData, isSupervisorAssignment, fields.length]);  let view = (<GQLTable config={config} />);

  // Render empty state if no slots
  if (!fields.length) {
    view = (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          No shift slots defined yet.
        </Typography>
        <Tooltip 
          title={
            (isSupervisorAssignment && fields.length >= 1) 
              ? "Supervisor assignments can only have one shift slot" 
              : ""
          }
          arrow
        >
          <span>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleOpenSlotModal}
              startIcon={<Iconify icon="ic:baseline-add" />}
              disabled={allDisabled || isComplete || (isSupervisorAssignment && fields.length >= 1)}
            >
              Add Shift Slot
            </Button>
          </span>
        </Tooltip>
      </Box>
    );
  }

  return (
    <>
      {view}
      
      {/* Slot count modal */}
      <Dialog open={slotModalOpen} onClose={handleCloseSlotModal}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSlotModal}>Cancel</Button>
          <Button variant='contained' onClick={handleSaveSlot} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirm.value}
        onClose={deleteConfirm.onFalse}
        title="Delete Shift Slot"
        content="Are you sure you want to delete this shift slot?"
        action={
          <LoadingButton 
            variant="contained" 
            color="error" 
            onClick={handleDeleteSlot}
          >
            Delete
          </LoadingButton>
        }
      />
    </>
  );
}