// @mui
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
// components
import Label from 'src/components/label';
// types
import { DocusignEvent } from 'src/__generated__/resolvers-types';
// utils
import { docusignStatusColor, docusignStatusLabel } from 'src/utils/docusign';
import { convertDate, useDateFormats } from 'src/hooks/use-datejs';
import { useAuthContext } from 'src/auth/hooks';

interface UserActivityItemProps {
  docusignEvents: DocusignEvent[];
}

export function UserActivityDocusign({ docusignEvents }: UserActivityItemProps) {
  const { user } = useAuthContext();
  const { dateTimeFormat } = useDateFormats();

  if (docusignEvents.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        No Docusign events found
      </Typography>
    );
  }

  return (
    <List sx={{ width: '100%' }}>
      {docusignEvents.map((event) => (
        <ListItem
          key={event.id}
          disableGutters
        >
          <ListItemAvatar sx={{ minWidth: 80 }}>
            <Label color={docusignStatusColor(event.status)}>{docusignStatusLabel(event.status)}</Label>
          </ListItemAvatar>
          <ListItemText primary={convertDate({date: event.updatedAt, user}).format(dateTimeFormat)} />
        </ListItem>
      ))}
    </List>
  );
}
