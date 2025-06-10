import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Iconify from 'src/components/iconify/iconify';
import { useEndOfShiftDownload } from 'src/hooks/use-download-end-of-shift';

interface IProps {
  enabled: boolean;
  eventId?: string;
  name?: string;
  menuClose: () => void;
}

export const EndOfShiftMenuItems = ({
  enabled,
  eventId,
  name,
  menuClose,
}: IProps) => {
  const { downloadAllEventShiftsPDF } = useEndOfShiftDownload();

  if (!enabled) {
    return null;
  }

  return (
    <MenuItem disabled={!eventId} onClick={() => {
      downloadAllEventShiftsPDF(eventId!, name!);
      menuClose();
    }}>
      <ListItemIcon>
        <Iconify icon="ic:round-downloading" />
      </ListItemIcon>
      <ListItemText>Download all end of shift PDFs</ListItemText>
    </MenuItem>
  );
};
