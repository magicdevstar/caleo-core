// @mui
import { DialogProps } from '@mui/material/Dialog';

// ----------------------------------------------------------------------

export type ConfirmDialogProps = Omit<DialogProps, 'title' | 'content'> & {
  title?: React.ReactNode;
  content?: React.ReactNode;
  action: React.ReactNode | null;
  hasCancel?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onClose: VoidFunction;
};
