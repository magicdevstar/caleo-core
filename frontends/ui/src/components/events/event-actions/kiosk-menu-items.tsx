import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Iconify from 'src/components/iconify/iconify';
import { paths } from 'src/routes/paths';
import { UseBooleanReturnType } from 'src/hooks/use-boolean';
import { useRouter } from 'src/routes/hooks';

interface IProps {
  enabled?: boolean;
  kioskConfirm: UseBooleanReturnType<string>;
  eventId: string;
  menuClose: () => void;
}

export const KioskMenuItems = ({
  enabled,
  kioskConfirm,
  menuClose,
  eventId
}: IProps) => {
  const router = useRouter();

  if (!enabled) {
    return null;
  }
  return (
    <>
      <MenuItem onClick={() => {
        router.push(
          paths.dashboard.admin.eventManagement.resourceUnitDetail.replace(':eventId', eventId)
        );
        menuClose();
      }}>
        <ListItemIcon>
          <Iconify icon="ic:baseline-dashboard" />
        </ListItemIcon>
        <ListItemText>Event Dashboard</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => {
        kioskConfirm.onTrue(eventId);
        menuClose();
      }}>
        <ListItemIcon>
          <Iconify icon="material-symbols:moved-location" />
        </ListItemIcon>
        <ListItemText>Check in kiosk</ListItemText>
      </MenuItem>
    </>
  )
};
