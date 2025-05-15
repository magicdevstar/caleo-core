// @mui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
//
import { ConfirmDialogProps } from './types';
import FormProvider from '../hook-form';

// ----------------------------------------------------------------------

interface ConfirmDialogWithFormProps extends ConfirmDialogProps {
  methods: any;
  handleSubmit: any;
}

export default function ConfirmDialogWithForm({
  title,
  content,
  methods,
  handleSubmit,
  action,
  hasCancel = true,
  open,
  onClose,
  maxWidth = 'xs',
  ...other
}: ConfirmDialogWithFormProps) {
  return (
    <Dialog fullWidth maxWidth={maxWidth} open={open} onClose={onClose} {...other}>
      <FormProvider methods={methods} onSubmit={handleSubmit}>
        {title && <DialogTitle sx={{ pb: 2 }}>{title}</DialogTitle>}

        {content && <DialogContent sx={{ typography: 'body2' }}> {content} </DialogContent>}

        {action && (
          <DialogActions>
            {action}

            {hasCancel && <Button variant="outlined" color="inherit" onClick={onClose}>
              Cancel
            </Button>}
          </DialogActions>
        )}
      </FormProvider>
    </Dialog>
  );
}
