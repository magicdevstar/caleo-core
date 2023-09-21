import { Draggable } from '@hello-pangea/dnd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
// @mui
import { useTheme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper, { PaperProps } from '@mui/material/Paper';
// theme
import { bgBlur } from 'src/theme/css';
// types
import { Shift, ShiftLotteryRequest } from 'src/__generated__/resolvers-types';
// components
import Label from 'src/components/label';

// ----------------------------------------------------------------------

type Props = PaperProps & {
  index: number;
  task: Shift | ShiftLotteryRequest;
};

dayjs.extend(utc);
dayjs.extend(timezone);

export default function LotteryTaskItem({
  task,
  index,
  sx,
  ...other
}: Props) {
  const theme = useTheme();

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            width: 1,
            borderRadius: 1.5,
            overflow: 'hidden',
            position: 'relative',
            bgcolor: 'background.default',
            boxShadow: theme.customShadows.z1,
            '&:hover': {
              boxShadow: theme.customShadows.z20,
            },
            ...(snapshot.isDragging && {
              boxShadow: theme.customShadows.z20,
              ...bgBlur({
                opacity: 0.48,
                color: theme.palette.background.default,
              }),
            }),
            ...sx,
          }}
          {...other}
        >

          
          <Stack sx={{ px: 2, py: 2.5, position: 'relative' }}>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              {task.assignment.name}
            </Typography>
            <Typography variant="h5" component="div">
              {task.event.name}
            </Typography>
            <Typography sx={{ mb: 1.5, fontSize: 13 }} color="text.secondary">
              Start: {dayjs((task as Shift).startTime || (task as ShiftLotteryRequest)?.shift?.startTime).format('MM/DD/YYYY HH:mm')}
              <br />
              End: {dayjs((task as Shift).endTime || (task as ShiftLotteryRequest)?.shift?.endTime).format('MM/DD/YYYY HH:mm')}
            </Typography>
            <Stack flexWrap='wrap' direction="row" spacing={1}>
              
              {task.assignment.bwNeeded && <Label variant="soft" color="info">B&W Needed</Label>}
              {task.assignment.ranks?.length! > 0 && <Label variant="soft" color="info">{`Open to ${task.assignment.ranks?.length} ranks`}</Label>}
              {task.assignment.requiredSkills?.length! > 0 && <Label variant="soft" color="info">{`Open to ${task.assignment.requiredSkills?.length} skills`}</Label>}
            </Stack>
          </Stack>
        </Paper>
      )}
    </Draggable>
  );
}
