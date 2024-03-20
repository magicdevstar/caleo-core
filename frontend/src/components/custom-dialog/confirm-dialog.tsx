// @mui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
//
import { ConfirmDialogProps } from './types';

// ----------------------------------------------------------------------

export default function ConfirmDialog({
  title,
  content,
  action,
  hasCancel = true,
  open,
  onClose,
  maxWidth = 'xs',
  ...other
}: ConfirmDialogProps) {
  return (
    <Dialog fullWidth maxWidth={maxWidth} open={open} onClose={onClose} {...other}>
      <DialogTitle sx={{ pb: 2 }}>{title}</DialogTitle>

      {content && <DialogContent sx={{ typography: 'body2' }}> {content} </DialogContent>}

      {action && (
        <DialogActions>
          {action}

          {hasCancel && <Button variant="outlined" color="inherit" onClick={onClose}>
            Cancel
          </Button>}
        </DialogActions>
      )}
    </Dialog>
  );
}
