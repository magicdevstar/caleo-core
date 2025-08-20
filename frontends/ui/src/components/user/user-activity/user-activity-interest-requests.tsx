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

interface UserActivityInterestRequest {
  id: string;
  status: string;
  date: any; // dayjs.Dayjs
  labelColor: string;
}

interface UserActivityInterestRequestsProps {
  interestRequests: UserActivityInterestRequest[];
}

export function UserActivityInterestRequests({ interestRequests }: UserActivityInterestRequestsProps) {
  const { dateTimeFormat } = useDateFormats();

  if (interestRequests.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        No interest requests found
      </Typography>
    );
  }

  return (
    <List sx={{ width: '100%' }}>
      {interestRequests.map((request) => (
        <ListItem
          key={request.id}
          disableGutters
        >
          <ListItemAvatar sx={{ minWidth: 80 }}>
            <Label color={request.labelColor as any}>{request.status}</Label>
          </ListItemAvatar>
          <ListItemText primary={request.date.format(dateTimeFormat)} />
        </ListItem>
      ))}
    </List>
  );
}
