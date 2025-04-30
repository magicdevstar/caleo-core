import { gql, useMutation, useQuery } from "@apollo/client";
import { DragDropContext, Draggable, DropResult, Droppable } from "@hello-pangea/dnd";
import { useCallback, useState } from "react";
// mui
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import LoadingButton from "@mui/lab/LoadingButton";
import Stack from "@mui/material/Stack";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
// API
import { ShiftLotteryRequest } from "src/__generated__/resolvers-types";
import { GET_LOTTERY_SHIFTS, GET_LOTTERY_SHIFT_REQUESTS, REMOVE_LOTTERY_SHIFT_REQUEST } from "src/api/shifts";
import EmptyContent from "src/components/empty-content";
import ShiftItem from "src/components/shifts/shift-item";
import ShiftItemSkeleton from "src/components/shifts/shift-item-skeleton";
import { client } from "src/utils/apollo";
import { GET_LOTTERY_COUNTER } from "src/api/event";
import { ConfirmDialog } from "src/components/custom-dialog";
import { useBoolean } from "src/hooks/use-boolean";
import Label from "src/components/label";
import { convertDate, dateTimeFormat } from "src/hooks/use-datejs";
import { useAuthContext } from "src/auth/hooks";
import { useSnackbar } from "src/components/snackbar";
import Iconify from "src/components/iconify";

export default function RankShifts() {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const [updating, setUpdating] = useState<boolean>(false);
  const [shiftToBeRemoved, setShiftToBeRemoved] = useState<ShiftLotteryRequest | null>(null);
  const [shiftMoveIndex, setShiftMoveIndex] = useState<number>(0);
  const [shiftMoveInput, setShiftMoveInput] = useState<number>(1);
  const removePrompt = useBoolean();
  const movePrompt = useBoolean();
  const [removeRequest] = useMutation(REMOVE_LOTTERY_SHIFT_REQUEST, {
    refetchQueries: [GET_LOTTERY_SHIFTS],
  });
  const { data: counterData, loading: counterLoading } = useQuery(GET_LOTTERY_COUNTER);

  const { data, loading: requestLoading, refetch: refetchLotteryRequests } = useQuery(GET_LOTTERY_SHIFT_REQUESTS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        counters: [counterData?.lotteryCounter?.counter],
      },
    },
    skip: counterLoading,
  });
  const loading = requestLoading || counterLoading;

  const { shiftLotteryRequests: { items } } = JSON.parse(JSON.stringify(data || { shiftLotteryRequests: { items: [], total: 0 } }));

  const moveShifts = useCallback(async (sourceIndex: number, destinationIndex: number) => {
    setUpdating(true);
    const originalItems = JSON.parse(JSON.stringify(items));
    try {
      const itemToMove = items[sourceIndex];
      items.splice(sourceIndex, 1);
      items.splice(destinationIndex, 0, itemToMove);
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
      enqueueSnackbar('Failed to re-order shifts. Please try again.', { variant: 'error' });
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
  }, [items, enqueueSnackbar]);

  const onDragEnd = useCallback(({ destination, source }: DropResult) => {
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    moveShifts(source.index, destination.index);
  }, [moveShifts]);

  const closeRemove = useCallback(() => {
    removePrompt.onFalse();
    setTimeout(() => {
      setShiftToBeRemoved(null);
    }, 200);
  },[removePrompt, setShiftToBeRemoved]);

  const handleRemove = useCallback(async () => {
    setUpdating(true);
    try {
      await removeRequest({
        variables: {
          id: shiftToBeRemoved!.id
        },
      });
      await refetchLotteryRequests();
    } catch (error) {
      enqueueSnackbar('Failed to remove shift. Please try again.', { variant: 'error' });
    }
    closeRemove();
    setUpdating(false);
  },[removeRequest, shiftToBeRemoved, closeRemove, refetchLotteryRequests, enqueueSnackbar]);

  const closeMove = useCallback(() => {
    movePrompt.onFalse();
    setTimeout(() => {
      setShiftMoveIndex(0);
      setShiftMoveInput(1);
    }, 200);
  }, [movePrompt]);

  const handleMove = useCallback(() => {
    if (shiftMoveIndex !== shiftMoveInput - 1) {
      moveShifts(shiftMoveIndex, shiftMoveInput - 1);
    }
    closeMove();
  }, [shiftMoveIndex, shiftMoveInput, moveShifts, closeMove]);

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
      <Box sx={{ mt: -2, mb: 2, minHeight: '4px' }}>
        {updating &&  <LinearProgress color="info" />}
      </Box>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="Lottery items" type="TASK">
          {(dropProvided) => (
            <div {...dropProvided.droppableProps} ref={dropProvided.innerRef} style={{ paddingBottom: '16px'}}>
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
                          shift={shift}
                          cursor="grab"
                          compact
                          titlePrefix={{
                            getColor: () => 'info',
                            sx: {
                              ml: -0.5,
                            },
                            getPrefix: (shiftRequest: ShiftLotteryRequest) => `${(shiftRequest.order || 0) + 1}`,
                          }}
                          shiftActions={[
                            {
                              key: 'move-shift-custom',
                              disabled: () => false,
                              getName: () => 'Move ...',
                              getIcon: () => 'mdi:arrow-expand-vertical',
                              onClick: (shiftRequest: ShiftLotteryRequest) => {
                                setShiftMoveIndex(index);
                                setShiftMoveInput(index + 1);
                                movePrompt.onTrue();
                              }
                            },
                            {
                              key: 'move-shift-up',
                              disabled: () => index === 0,
                              getName: () => 'Move Up',
                              getIcon: () => 'mdi:arrow-up',
                              onClick: (shiftRequest: ShiftLotteryRequest) => {
                                moveShifts(index, index - 1);
                              }
                            },
                            {
                              key: 'move-shift-down',
                              disabled: () => items.length - 1 === index,
                              getName: () => 'Move Down',
                              getIcon: () => 'mdi:arrow-down',
                              onClick: (shiftRequest: ShiftLotteryRequest) => {
                                moveShifts(index, index + 1);
                              }
                            },
                            {
                              key: 'remove-shift',
                              color: 'error',
                              disabled: () => false,
                              getName: () => 'Remove',
                              getIcon: () => 'mdi:close-thick',
                              onClick: (shiftRequest: ShiftLotteryRequest) => {
                                setShiftToBeRemoved(shiftRequest);
                                removePrompt.onTrue();
                              }
                            }
                          ]}
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
      <ConfirmDialog
        open={removePrompt.value}
        title="Remove Shift"
        hasCancel
        onClose={closeRemove}
        content={(
          <>
            <Typography variant='body1'>
              Are you sure you want to remove this shift?
            </Typography>
            <Stack spacing={0.5} sx={{ pl: 1, mt: 2}}>
              <Stack direction="row" sx={{}} alignItems="center">
                <Label color="info" sx={{ mr: 1, ml: -0.6, }}>{(shiftToBeRemoved?.order || 0) + 1}</Label>
                <Typography variant='body1' sx={{ fontWeight: 'bold'}}>{shiftToBeRemoved?.shift?.event?.name}</Typography>
              </Stack>
              <Typography variant='body1' sx={{ fontWeight: 'bold' }}>{shiftToBeRemoved?.shift?.assignment?.name}</Typography>
              <Typography variant='subtitle2' sx={{ color: 'text.secondary' }}>
                {convertDate({ date: shiftToBeRemoved?.shift?.startTime || '', user}).format(dateTimeFormat)}
                {' - '}
                {convertDate({ date: shiftToBeRemoved?.shift?.endTime || '', user}).format(dateTimeFormat)}
              </Typography>
            </Stack>
          </>
        )}
        action={
          <LoadingButton
            loading={updating}
            variant="contained"
            color="error"
            onClick={handleRemove}
          >
            Remove
          </LoadingButton>
        }
      />
      <ConfirmDialog
        fullWidth={false}
        open={movePrompt.value}
        title={
          <Typography variant="inherit">
            Move Shift
            <Label color="info" sx={{mx: 1, position: 'relative', bottom: 2}}>{shiftMoveIndex + 1}</Label>
            to :
          </Typography>
        }
        hasCancel
        onClose={closeMove}
        content={(
          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} justifyContent="center">
            <TextField
              sx={{ width: 80 }}
              inputProps={{ type: 'number', style: { textAlign: 'center' } }}
              error={shiftMoveInput > items.length || shiftMoveInput <= 0}
              value={shiftMoveInput || ''}
              onChange={({ target: { value } }) => {
                if (value === '') {
                  setShiftMoveInput(0);
                } else {
                  const formattedValue = parseInt(value, 10);
                  if (Number.isInteger(formattedValue)) {
                    setShiftMoveInput(formattedValue);
                  }
                }
              }}
            />
            <ButtonGroup orientation="vertical" variant="soft" color="inherit">
              <Button sx={{ height: '26px', minWidth: '15px'}} onClick={() => setShiftMoveInput(1)}><Iconify width={14} icon="mdi:arrow-collapse-up" /></Button>
              <Button sx={{ height: '26px', minWidth: '15px'}} onClick={() => setShiftMoveInput(items.length)}><Iconify width={14} icon="mdi:arrow-collapse-down" /></Button>
            </ButtonGroup>
          </Stack>
        )}
        action={
          <LoadingButton
            disabled={shiftMoveInput > items.length || shiftMoveInput <= 0}
            variant="contained"
            color="primary"
            onClick={handleMove}
          >
            Confirm
          </LoadingButton>
        }
      />
    </>
  );
}
