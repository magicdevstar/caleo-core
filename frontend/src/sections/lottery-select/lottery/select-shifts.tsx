import { useCallback, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useSnackbar } from "notistack";
// Hooks
import { useAuthContext } from "src/auth/hooks";
// API
import {
  CREATE_SHIFT_LOTTERY_REQUEST,
  GET_LOTTERY_SHIFTS,
  REMOVE_LOTTERY_SHIFT_REQUEST
} from "src/api/shifts";
// types
import { Shift } from "src/__generated__/resolvers-types";
// components
import ShiftItems from "src/components/shifts/shift-items";
import { client } from "src/utils/apollo";

export default function SelectShifts({
  data,
  loading,
}: { data: any, loading: boolean }) {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const [selectLoadingIndex, setSelectLoadingIndex] = useState<number | null>(null);
  const [removeRequest] = useMutation(REMOVE_LOTTERY_SHIFT_REQUEST);
  const [upsertRequest] = useMutation(CREATE_SHIFT_LOTTERY_REQUEST);

  const { lotteryShifts: { items, total } } = data || { lotteryShifts: { items: [], total: 0 } };

  const handleSelect = useCallback(async (shift: Shift, event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    try {
      setSelectLoadingIndex(index);
      if (event.target.checked) {
        await upsertRequest({
          variables: {
            input: {
              shiftGroupId: shift.shiftId,
              userId: user?.id,
            },
          },
        });
      } else if (shift?.lotteryRequest?.id) {
        await removeRequest({
          variables: {
            id: shift.lotteryRequest.id,
          },
        })
      }
      await client.refetchQueries({
        include: [GET_LOTTERY_SHIFTS],
      });
    } catch(error) {
      enqueueSnackbar('Something went wrong. Please try again.', {
        variant: 'error',
        autoHideDuration: 3000,
      });
      console.log(error);
    } finally {
      setSelectLoadingIndex(null);
    }
  }, [
    user,
    upsertRequest,
    removeRequest,
    setSelectLoadingIndex,
    enqueueSnackbar,
  ]);

  return (
    <ShiftItems
      emptyMessage='No shifts to rank at this time. Please check back later.'
      pageSize={100000}
      total={total}
      setPage={() => {}}
      currentPage={1}
      shifts={items}
      selectLoadingIndex={selectLoadingIndex}
      selectable
      onSelect={handleSelect}
      shiftActions={[]}
      loading={loading}
    />
  );
}
