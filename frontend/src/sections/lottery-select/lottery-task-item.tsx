import { Draggable } from '@hello-pangea/dnd';
// @mui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Paper, { PaperProps } from '@mui/material/Paper';
import AvatarGroup, { avatarGroupClasses } from '@mui/material/AvatarGroup';
// theme
import { bgBlur } from 'src/theme/css';
// types
import { IKanbanTask } from 'src/types/kanban';
// components
import Iconify from 'src/components/iconify';
import { Shift } from 'src/__generated__/resolvers-types';

// ----------------------------------------------------------------------

type Props = PaperProps & {
  index: number;
  task: Shift;
};

export default function LotteryTaskItem({
  task,
  index,
  sx,
  ...other
}: Props) {
  const theme = useTheme();

  return (
    <>
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

            <Stack spacing={2} sx={{ px: 2, py: 2.5, position: 'relative' }}>
              <Typography variant="subtitle2">{task.event.name}</Typography>
              <Typography variant="caption">{task.assignment.name}</Typography>
            </Stack>
          </Paper>
        )}
      </Draggable>
    </>
  );
}
