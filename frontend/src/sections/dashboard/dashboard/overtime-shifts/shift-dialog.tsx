// @mui
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Stack from "@mui/material/Stack";
import Typography from '@mui/material/Typography';
import { SxProps } from '@mui/material/styles';
// __generated__
import { Shift, ShiftBufferRequest, ShiftLotteryRequest } from 'src/__generated__/resolvers-types';
// components
import { LabelColor, LabelVariant } from 'src/components/label';
import ShiftItem from 'src/components/shifts/shift-item';
import ShiftItemSkeleton from 'src/components/shifts/shift-item-skeleton';
import Iconify from 'src/components/iconify';

type ShiftDialogProps = {
  open: boolean;
  onClose: VoidFunction;
  shift: Shift | ShiftBufferRequest | ShiftLotteryRequest | null;
  shiftLabels?: {
    key: string;
    sx?: SxProps;
    variant?: LabelVariant;
    getHidden?: (shift: any) => boolean;
    getColor?: (shift: any) => LabelColor;
    getLabel: (shift: any) => string;
  }[];
  shiftActions: {
    key: string;
    color?: string;
    disabled: (shift: any) => boolean;
    onClick: (shift: any) => void;
    getIcon: (shift: any) => string;
    getName: (shift: any) => string;
  }[];
};

export default function ShiftDialog({
  open,
  onClose,
  shift,
  shiftLabels,
  shiftActions,
}: ShiftDialogProps) {
  return (
    <Dialog
      open={open}
      maxWidth="md"
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
        }
      }}
    >
      <DialogTitle sx={{pr: 2, pl: 3, py: 2, backgroundColor: 'background.paper', mb: -1.5}}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="inherit" color="text.secondary">Shift Details</Typography>
          <IconButton onClick={onClose}>
            <Iconify icon="material-symbols:close" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ px: 0 }}>
        {shift ? (
          <ShiftItem
            index={0}
            shift={shift}
            shiftLabels={shiftLabels}
            shiftActions={shiftActions}
            collapsible={false}
            collapsed
            cursor="default"
            sx={{
              p: 0,
            }}
          />
        ) : (
          <ShiftItemSkeleton />
        )}
      </DialogContent>
    </Dialog>
  );
}
