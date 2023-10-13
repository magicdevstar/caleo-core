import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import ObjectID from 'bson-objectid';
// @mui
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
// theme
import { hideScroll } from 'src/theme/css';
// api
import { CREATE_SHIFT_LOTTERY_REQUEST, GET_LOTTERY_SHIFTS, GET_LOTTERY_SHIFT_REQUESTS, REMOVE_LOTTERY_SHIFT_REQUEST } from 'src/api/shifts';
import { Shift, ShiftLotteryRequest } from 'src/__generated__/resolvers-types';
import { IKanbanColumn } from 'src/types/kanban';
// components
import EmptyContent from 'src/components/empty-content';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
import { useAuthContext } from 'src/auth/hooks';
//
import LotteryColumn from '../lottery-column';
import { LotteryColumnSkeleton } from '../lottery-skeleton';

// ----------------------------------------------------------------------

const columns = {
  'open': {
    id: 'open',
    name: 'Shifts',
    taskIds: [],
  },
  'selected': {
    id: 'selected',
    name: 'Selected',
    taskIds: [],
  },
};

export default function LotterySelectView() {
  const { user } = useAuthContext();
  const initialLoading = useBoolean(true);
  
  const [lottoBoard, setLottoBoard] = useState<{
    columns: Record<string, {id: string; name: string; taskIds: string[]}>;
    ordered: string[];
    tasks: Record<string, Shift | ShiftLotteryRequest>;
    empty: boolean;
    initialized: boolean;
  }>({
    columns,
    ordered: Object.keys(columns),
    tasks: {},
    empty: true,
    initialized: false,
  });

  const { data: lotteryShiftData, loading: loadingLotteryShifts } = useQuery(GET_LOTTERY_SHIFTS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
  });
  const { data: lotteryShiftRequestData, loading: loadingLotteryShiftRequests } = useQuery(GET_LOTTERY_SHIFT_REQUESTS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
  });
  const [removeRequest] = useMutation(REMOVE_LOTTERY_SHIFT_REQUEST);
  const [upsertRequest] = useMutation(CREATE_SHIFT_LOTTERY_REQUEST);

  // Convert to MUI Kanban structure
  useEffect(() => {
    if (
      !lottoBoard.initialized &&
      lotteryShiftRequestData?.shiftLotteryRequests?.items &&
      lotteryShiftData?.lotteryShifts?.items
    ) {
      const ranked = lotteryShiftRequestData?.shiftLotteryRequests?.items || [];
      const rankedShiftGroupIds = ranked.map(({ shiftGroupId }: ShiftLotteryRequest) => shiftGroupId);
      const shifts = (lotteryShiftData?.lotteryShifts?.items || []).filter((s: Shift) => !rankedShiftGroupIds.includes(s.shiftId));
      const shiftIds = shifts.map(({ id }: Shift) => id);
      const rankedIds = ranked.map(({ id }: ShiftLotteryRequest) => id);
  
      const lottoColumns = {
        open: {
          ...columns.open,
          taskIds: shiftIds,
        },
        selected: {
          ...columns.selected,
          taskIds: rankedIds,
        },
      } as Record<string, IKanbanColumn>;
      const ordered = Object.keys(lottoColumns);
      const tasks = [
        ...shifts,
        ...ranked,
      ].reduce((acc, shift: Shift | ShiftLotteryRequest) => ({
        ...acc,
        [shift.id]: shift,
      }), {} as Record<string, Shift>);
  
      setLottoBoard({
        columns: lottoColumns as any,
        ordered,
        tasks,
        empty: Object.keys(tasks).length === 0,
        initialized: true,
      });
    }
  }, [
    lotteryShiftData,
    lotteryShiftRequestData,
    setLottoBoard,
    lottoBoard.initialized,
  ]);

  useEffect(() => {
    if (!initialLoading.value) return;
    if (!loadingLotteryShiftRequests && !loadingLotteryShiftRequests) {
      initialLoading.onFalse();
    }
  }, [initialLoading, loadingLotteryShifts, loadingLotteryShiftRequests]);

  const onDragEnd = useCallback(
    async ({ destination, source, draggableId }: DropResult) => {
      try {
        if (!destination) {
          return;
        }

        if (destination.droppableId === source.droppableId && destination.index === source.index) {
          return;
        }

        const sourceColumn = lottoBoard?.columns[source.droppableId];
        const destinationColumn = lottoBoard?.columns[destination.droppableId];
        const shiftOrRequest: Shift | ShiftLotteryRequest = lottoBoard.tasks[draggableId];
        // Moving task to same list
        if (
          sourceColumn.id === destinationColumn.id ||
          destinationColumn.id === 'selected'
        ) {
          const requestId = shiftOrRequest.__typename === 'ShiftLotteryRequest' ? shiftOrRequest.id : ObjectID();
          upsertRequest({
            variables: {
              input: {
                id: requestId,
                ...(shiftOrRequest.__typename !== 'ShiftLotteryRequest' && { newId: requestId }),
                shiftGroupId: (shiftOrRequest as any).shiftGroupId || (shiftOrRequest as any).shiftId,
                order: destination.index,
                userId: user?.id,
              },
            },
          });
          if (shiftOrRequest.__typename === 'ShiftLotteryRequest') {
            // Update the order
            setLottoBoard((c) => {
              const { tasks, columns: col } = c;
              const { taskIds } = col.selected;

              taskIds.splice(source.index, 1);
              taskIds.splice(destination.index, 0, draggableId);

              return {
                ...c,
                columns: {
                  ...col,
                  selected: {
                    ...col.selected,
                    taskIds,
                  },
                },
                tasks: {
                  ...tasks,
                  [shiftOrRequest.id]: {
                    ...shiftOrRequest,
                    shiftId: (shiftOrRequest as any).shiftGroupId || (shiftOrRequest as any).shiftId,
                    shiftGroupId: (shiftOrRequest as any).shiftGroupId || (shiftOrRequest as any).shiftId,
                    __typename: 'ShiftLotteryRequest',
                    order: destination.index,
                  },
                },
              }
            });
          } else {
            // Add to selected
            setLottoBoard((c) => {
              const { tasks, columns: col } = c;
              delete tasks[shiftOrRequest.id];
              const selectedTaskIds = col.selected.taskIds;
              const openTaskIds = col.open.taskIds;

              // Remove from source
              openTaskIds.splice(source.index, 1);

              // Insert into destination
              selectedTaskIds.splice(destination.index, 0, requestId.toString());

              return {
                ...c,
                columns: {
                  ...col,
                  selected: {
                    ...col.selected,
                    taskIds: selectedTaskIds,
                  },
                  open: {
                    ...col.open,
                    taskIds: openTaskIds,
                  },
                },
                tasks: {
                  ...tasks,
                  [requestId.toString()]: {
                    ...shiftOrRequest,
                    id: requestId.toString(),
                    __typename: 'ShiftLotteryRequest',
                    shiftId: (shiftOrRequest as any).shiftGroupId || (shiftOrRequest as any).shiftId,
                    shiftGroupId: (shiftOrRequest as any).shiftGroupId || (shiftOrRequest as any).shiftId,
                    order: destination.index,
                  } as any,
                },
              }
            });
          }
          return;
        }

        // TODO: Add or remove lotto selection
        if (destinationColumn.id === 'open' && shiftOrRequest.__typename === 'ShiftLotteryRequest') {
          removeRequest({
            variables: {
              id: shiftOrRequest.id,
            },
          });
          // Remove from selected and add to shift column
          setLottoBoard((c) => {
            const { tasks, columns: col } = c;
            delete tasks[shiftOrRequest.id];
            const selectedTaskIds = col.selected.taskIds;
            const openTaskIds = col.open.taskIds;
            // delete tasks[shiftOrRequest.id];

            // Remove from source
            selectedTaskIds.splice(source.index, 1);

            // Insert into destination
            openTaskIds.splice(destination.index, 0, draggableId);

            return {
              ...c,
              columns: {
                ...col,
                selected: {
                  ...col.selected,
                  taskIds: selectedTaskIds,
                },
                open: {
                  ...col.open,
                  taskIds: openTaskIds,
                },
              },
              tasks: {
                ...tasks,
                [shiftOrRequest.id]: {
                  ...shiftOrRequest,
                  shiftId: shiftOrRequest.shiftGroupId || (shiftOrRequest as any).shiftId,
                  shiftGroupId: shiftOrRequest.shiftGroupId || (shiftOrRequest as any).shiftId,
                  __typename: 'Shift',
                  order: destination.index,
                } as any,
              },
            }
          });
        }
      } catch (error) {
        console.error(error);
      }
    },
    [
      lottoBoard?.columns,
      lottoBoard.tasks,
      user?.id,
      upsertRequest,
      removeRequest,
      setLottoBoard,
    ]
  );

  const renderSkeleton = (
    <Stack direction="row" alignItems="flex-start" spacing={3}>
      {[...Array(2)].map((_, index) => (
        <LotteryColumnSkeleton key={index} index={index} />
      ))}
    </Stack>
  );

  return (
    <Container
      maxWidth={false}
      sx={{
        height: 1,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      >
        Rank Overtime
      </Typography>

      {initialLoading.value && renderSkeleton}

      {!initialLoading.value && lottoBoard.empty && (
        <EmptyContent
          filled
          title="No Data"
          sx={{
            py: 10,
            maxHeight: { md: 480 },
          }}
        />
      )}

      {!initialLoading.value && !lottoBoard.empty && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Stack
            spacing={3}
            direction="row"
            alignItems="flex-start"
            sx={{
              p: 0.25,
              height: 1,
              overflowY: 'hidden',
              ...hideScroll.x,
            }}
          >
            {lottoBoard?.ordered.map((columnId, index) => (
              <LotteryColumn
                index={index}
                key={columnId}
                column={lottoBoard?.columns[columnId]}
                tasks={lottoBoard?.tasks}
              />
            ))}
          </Stack>
        </DragDropContext>
      )}
    </Container>
  );
}
