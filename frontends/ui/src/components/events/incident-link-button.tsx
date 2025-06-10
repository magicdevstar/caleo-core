import Button from '@mui/material/Button';
import { useIncidentLinks } from 'src/hooks/use-incident-link';
import Iconify from '../iconify';

interface IProps {
  eventId?: string;
}

export const IncidentLinkButton = ({
  eventId,
}: IProps) => {
  const { copyLink } = useIncidentLinks(eventId || '');

  return (
    <Button onClick={copyLink} variant="contained" startIcon={<Iconify icon="mdi:content-copy" />}>
      Copy Form Link
    </Button>
  )
};
