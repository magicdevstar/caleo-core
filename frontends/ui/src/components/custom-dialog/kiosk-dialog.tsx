import { useMemo } from 'react';
import { Link } from 'react-router-dom';
// @mui
import Button from '@mui/material/Button';
// components
import { ConfirmDialog } from 'src/components/custom-dialog';
// routes
import { paths } from 'src/routes/paths';

export interface KioskOpenDialogProps {
  /** 
   * `useBoolean()` hook result 
   *  - value: boolean 
   *  - onFalse: () => void 
   */
  kioskConfirm: {
    value: boolean;
    onFalse: () => void;
  };
  eventId: string;
}

export default function KioskOpenDialog({
  kioskConfirm,
  eventId,
}: KioskOpenDialogProps) {
  const checkInKioskUrl = useMemo(
    () => paths.kiosk.root.replace(':eventId', eventId),
    [eventId]
  );

  return (
    <ConfirmDialog
      open={kioskConfirm.value}
      onClose={kioskConfirm.onFalse}
      title="Are you sure you want to open the check-in kiosk?"
      content="If you open the kiosk view you will not be able to open the event dashboard until you close the kiosk view and log back in."
      action={
        <Button
          variant="contained"
          color="error"
          component={Link}
          to={checkInKioskUrl}
          sx={{ marginRight: 2 }}
        >
          Open Check In Kiosk
        </Button>
      }
    />
  );
}
