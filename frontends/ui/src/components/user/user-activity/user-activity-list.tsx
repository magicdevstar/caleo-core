// @mui
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
// components
import Label from 'src/components/label';
// hooks
import { useDateFormats } from 'src/hooks/use-datejs';
// types
import { UserActivityItem } from './hooks/use-user-activity';

interface UserActivityListProps {
  items: UserActivityItem[];
  emptyMessage?: string;
}

export function UserActivityList({ items, emptyMessage = "No items found" }: UserActivityListProps) {
  const { dateTimeFormat } = useDateFormats();

  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <List sx={{ width: '100%' }}>
      {items.map((item) => (
        <ListItem
          key={item.id}
          disableGutters
        >
          <ListItemAvatar sx={{ minWidth: 80 }}>
            <Label color={item.labelColor as any}>{item.status}</Label>
          </ListItemAvatar>
          <ListItemText 
            primary={item.title}
            secondary={item.date.format(dateTimeFormat)}
          />
        </ListItem>
      ))}
    </List>
  );
}
