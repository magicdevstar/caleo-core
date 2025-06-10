import LoadingButton from '@mui/lab/LoadingButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import { Event } from 'src/__generated__/resolvers-types';
import Iconify from 'src/components/iconify/iconify';
import { useEventSummary } from 'src/hooks/use-event-summary';

interface IProps {
  event: Event;
}

interface IMenuProps extends IProps {
  menuClose: () => void;
}

export const DownloadSummaryMenuItem = ({
  event,
  menuClose,
}: IMenuProps) => {
  const { generateEventDownload } = useEventSummary();
  return (
    <MenuItem onClick={() => {
      if (event) {
        generateEventDownload(event?.id)
      }
      menuClose();
    }}>
      <ListItemIcon>
        <Iconify icon="mdi:file-download" />
      </ListItemIcon>
      <ListItemText>Download Summary</ListItemText>
    </MenuItem>
  )
}

export const DownloadSummary = ({
  event,
}: IProps) => {
  const { generateEventDownload, loading: summaryLoading } = useEventSummary();
  return (
    <LoadingButton
      loading={summaryLoading}
      size="small"
      variant='contained'
      startIcon={<Iconify icon="mdi:file-download" />}
      onClick={() => {
        if (event) {
          generateEventDownload(event.id)
        }
      }}
    >Download summary</LoadingButton>
  );
}