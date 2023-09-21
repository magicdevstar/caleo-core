import { Droppable } from '@hello-pangea/dnd';
// @mui
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
// types
import { IKanbanColumn } from 'src/types/kanban';
import { Shift, ShiftLotteryRequest } from 'src/__generated__/resolvers-types';
//
import LotteryTaskItem from './lottery-task-item';

// ----------------------------------------------------------------------

type Props = {
  column: IKanbanColumn;
  tasks: Record<string, Shift | ShiftLotteryRequest>;
  index: number;
};

export default function LotteryColumn({ column, tasks }: Props) {
  return (
    <Paper
      sx={{
        px: 2,
        borderRadius: 2,
        bgcolor: 'background.neutral',
      }}
    >
      <Stack>
        <Droppable droppableId={column.id} type="TASK">
          {(dropProvided) => (
            <Stack
              ref={dropProvided.innerRef}
              {...dropProvided.droppableProps}
              spacing={2}
              sx={{
                py: 3,
                width: 280,
              }}
            >
              <Typography variant='h6'>{ column.name }</Typography>
              {column.taskIds.map((taskId, taskIndex) => (
                <LotteryTaskItem
                  key={taskId}
                  index={taskIndex}
                  task={tasks[taskId]}
                />
              ))}
              {dropProvided.placeholder}
            </Stack>
          )}
        </Droppable>
      </Stack>
    </Paper>
  );
}
