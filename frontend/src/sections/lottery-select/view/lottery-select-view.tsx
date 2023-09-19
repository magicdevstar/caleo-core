import { useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
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
  const { data: lotteryShiftData, loading: loadingLotteryShifts } = useQuery(GET_LOTTERY_SHIFTS);
  const { data: lotteryShiftRequestData, loading: loadingLotteryShiftRequests } = useQuery(GET_LOTTERY_SHIFT_REQUESTS);
  const [removeRequest] = useMutation(REMOVE_LOTTERY_SHIFT_REQUEST, {
    refetchQueries: [GET_LOTTERY_SHIFT_REQUESTS, GET_LOTTERY_SHIFTS]
  });
  const [upsertRequest] = useMutation(CREATE_SHIFT_LOTTERY_REQUEST, {
    refetchQueries: [GET_LOTTERY_SHIFT_REQUESTS, GET_LOTTERY_SHIFTS]
  });

  // Convert to MUI Kanban structure
  const lottoBoard = useMemo(() => {
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

    return {
      columns: lottoColumns,
      ordered,
      tasks,
      empty: Object.keys(tasks).length === 0,
    };
  }, [lotteryShiftData, lotteryShiftRequestData]);

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
          await upsertRequest({
            variables: {
              input: {
                id: shiftOrRequest.__typename === 'ShiftLotteryRequest' ? shiftOrRequest.id : undefined,
                shiftGroupId: shiftOrRequest.__typename === 'ShiftLotteryRequest' ? shiftOrRequest.shiftGroupId : (shiftOrRequest as Shift).shiftId,
                order: destination.index,
                userId: user?.id,
              },
            },
          });
          return;
        }

        // TODO: Add or remove lotto selection
        if (destinationColumn.id === 'open' && shiftOrRequest.__typename === 'ShiftLotteryRequest') {
          await removeRequest({
            variables: {
              id: shiftOrRequest.id,
            },
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

      {!initialLoading.value && !!lottoBoard?.ordered.length && (
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
