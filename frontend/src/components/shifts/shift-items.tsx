// @mui
import Grid from "@mui/material/Grid";
import Pagination, { paginationClasses } from "@mui/material/Pagination";
import { SxProps } from "@mui/material";
// types
import { Shift, ShiftBufferRequest, ShiftLotteryRequest } from "src/__generated__/resolvers-types";
// components
import ShiftItem from "./shift-item";
import ShiftItemSkeleton from "./shift-item-skeleton";
import EmptyContent from "../empty-content";
import { LabelColor, LabelVariant } from "../label";

// TODO: Test pagination :)
export default function ShiftItems({
  shifts,
  loading,
  shiftLabels,
  shiftActions,
  pageSize,
  total,
  currentPage,
  emptyMessage = 'No Data',
  selectable = false,
  selectLoadingIndex,
  setPage,
  onSelect = () => {},
}: {
  shifts: Shift[] | ShiftBufferRequest[] | ShiftLotteryRequest[];
  loading: boolean;
  total: number;
  pageSize: number;
  currentPage: number;
  emptyMessage?: string;
  selectable?: boolean;
  selectLoadingIndex?: number | null;
  onSelect?: (shift: Shift, event: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  setPage: (page: any) => void;
  shiftLabels?: {
    key: string;
    sx?: SxProps;
    variant?: LabelVariant;
    getHidden?: (shift: any) => boolean;
    getColor?: (shift: any) => LabelColor;
    getLabel: (shift: any) => string;
  }[]
  shiftActions: {
    key: string;
    color?: string;
    disabled: (shift: any) => boolean;
    onClick: (shift: any) => void;
    getIcon: (shift: any) => string;
    getName: (shift: any) => string;
  }[]
}) {
  const renderSkeleton = (
    <>
      {[...Array(16)].map((_, index) => (
        <ShiftItemSkeleton key={index} />
      ))}
    </>
  );

  let renderList = (
    <EmptyContent filled title={emptyMessage} sx={{ py: 10 }} />
  )

  if (shifts.length > 0) {
    renderList = (
      <>
        {shifts.map((shift, index) => (
          <ShiftItem
            key={shift.id}
            index={index}
            selectLoading={selectLoadingIndex === index}
            selectable={selectable}
            onSelect={onSelect}
            shiftLabels={shiftLabels}
            shiftActions={shiftActions}
            shift={shift}
          />
        ))}
      </>
    );
  }

  return (
    <>
      <Grid container spacing={2} sx={{ padding: '9px' }}>
        {loading ? renderSkeleton : renderList}
      </Grid>

      {total > pageSize && (
        <Pagination
          count={Math.ceil(total / pageSize)}
          page={currentPage}
          onChange={(_event, page) => setPage(page)}
          sx={{
            mt: 8,
            [`& .${paginationClasses.ul}`]: {
              justifyContent: 'center',
            },
          }}
        />
      )}
    </>
  );
}
