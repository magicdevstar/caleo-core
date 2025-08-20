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

interface UserActivityShift {
  id: string;
  status: string;
  date: any; // dayjs.Dayjs
  labelColor: string;
}

interface UserActivityShiftsProps {
  shifts: UserActivityShift[];
}

export function UserActivityShifts({ shifts }: UserActivityShiftsProps) {
  const { dateTimeFormat } = useDateFormats();

  if (shifts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        No shifts found
      </Typography>
    );
  }

  return (
    <List sx={{ width: '100%' }}>
      {shifts.map((shift) => (
        <ListItem
          key={shift.id}
          disableGutters
        >
          <ListItemAvatar sx={{ minWidth: 80 }}>
            <Label color={shift.labelColor as any}>{shift.status}</Label>
          </ListItemAvatar>
          <ListItemText primary={shift.date.format(dateTimeFormat)} />
        </ListItem>
      ))}
    </List>
  );
}
