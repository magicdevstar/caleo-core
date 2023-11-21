import { gql, useQuery } from "@apollo/client";
import { DragDropContext, Draggable, DropResult, Droppable } from "@hello-pangea/dnd";
import { useCallback, useState } from "react";
// mui
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
// API
import { ShiftLotteryRequest } from "src/__generated__/resolvers-types";
import { GET_LOTTERY_SHIFT_REQUESTS } from "src/api/shifts";
import EmptyContent from "src/components/empty-content";
import ShiftItem from "src/components/shifts/shift-item";
import ShiftItemSkeleton from "src/components/shifts/shift-item-skeleton";
import { client } from "src/utils/apollo";

export default function RankShifts() {
  const [updating, setUpdating] = useState<boolean>(false);
  const { data, loading } = useQuery(GET_LOTTERY_SHIFT_REQUESTS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
  });

  const { shiftLotteryRequests: { items } } = JSON.parse(JSON.stringify(data || { shiftLotteryRequests: { items: [], total: 0 } }));

  const onDragEnd = useCallback(async ({ destination, source, draggableId }: DropResult) => {
    setUpdating(true);
    const originalItems = JSON.parse(JSON.stringify(items));
    try {
      if (!destination) {
        return;
      }

      if (destination.droppableId === source.droppableId && destination.index === source.index) {
        return;
      }
      const itemToMove = items[source.index];
      items.splice(source.index, 1);
      items.splice(destination.index, 0, itemToMove);
      const orderedItems = items.map((item: ShiftLotteryRequest, index: number) => ({
        ...item,
        order: index,
      }));

      await client.writeQuery({
        query: GET_LOTTERY_SHIFT_REQUESTS,
        data: {
          shiftLotteryRequests: {
            items: orderedItems,
            total: orderedItems.length,
            __typename: 'ShiftLotteryRequestsSearchResult',
          },
        }
      });

      const updates = orderedItems.reduce((obj: any, item: ShiftLotteryRequest, index: number) => {
        obj.input.push(`$input${index}: UpsertShiftLotteryRequest`);
        obj.req.push(`shiftLotteryRequest${index}: shiftLotteryRequest(shiftLotteryRequest: $input${index}) {
          id
        }`);
        obj.variables = {
          ...obj.variables,
          [`input${index}`]: {
            id: item.id,
            shiftGroupId: item.shiftGroupId,
            userId: item.userId,
            order: item.order,
          },
        };

        return obj;
      }, {
        input: [],
        req: [],
        variables: {},
      });

      const mutation = gql`mutation UpsertShiftLotteryRequest(${updates.input.join(', ')}) {
        ${updates.req.join('\n')}
      }`;

      await client.mutate({
        mutation,
        variables: updates.variables,
      });
    } catch(error) {
      await client.writeQuery({
        query: GET_LOTTERY_SHIFT_REQUESTS,
        data: {
          shiftLotteryRequests: {
            items: originalItems,
            total: originalItems.length,
            __typename: 'ShiftLotteryRequestsSearchResult',
          },
        }
      });
    } finally {
      setUpdating(false);
    }
  }, [items]);

  if (loading) {
    return (
      <>
        {[...Array(16)].map((_, index) => (
          <ShiftItemSkeleton key={index} />
        ))}
      </>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <EmptyContent filled title='No shifts to rank. Please select shifts from the select tab.' sx={{ py: 10 }} />
    );
  }

  return (
    <>
      <Box sx={{ mb: 2, minHeight: '4px' }}>
        {updating &&  <LinearProgress color="info" />}
      </Box>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="Lottery items" type="TASK">
          {(dropProvided) => (
            <div {...dropProvided.droppableProps} ref={dropProvided.innerRef}>
              {items
                .sort((a: ShiftLotteryRequest, b: ShiftLotteryRequest) => (a.order || -1) - (b.order || -1))
                .map((shift: ShiftLotteryRequest, index: number) => (
                  <Draggable key={shift.id} draggableId={shift.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <ShiftItem
                          key={shift.id}
                          index={index}
                          shiftActions={[]}
                          shift={shift}
                          cursor="grab"
                        />
                      </div>
                    )}
                  </Draggable>
                ))
              }
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
}
