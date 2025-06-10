import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Iconify from "src/components/iconify";
import { useOvertimeSlips } from "src/hooks/use-overtime-slips";

interface IProps {
  enabled: boolean;
  eventId?: string;
  menuClose: () => void;
}

export const OvertimeSlipsMenuItems = ({
  enabled,
  eventId,
  menuClose,
}: IProps) => {
  const { generateOvertimeSlipsDownload } = useOvertimeSlips();

  if (!enabled) {
    return null;
  }

  return (
    <MenuItem disabled={!eventId} onClick={() => {
      if (eventId) {
        generateOvertimeSlipsDownload(eventId);
      }
      menuClose();
    }}>
      <ListItemIcon>
        <Iconify icon="mdi:file-download" />
      </ListItemIcon>
      <ListItemText>Download Overtime Slips</ListItemText>
    </MenuItem>
  );
};
