// @mui
import Grid from "@mui/material/Grid";
import Pagination, { paginationClasses } from "@mui/material/Pagination";
import { Shift, ShiftBufferRequest } from "src/__generated__/resolvers-types";
// components
import ShiftItem from "./shift-item";
import ShiftItemSkeleton from "./shift-item-skeleton";
import EmptyContent from "../empty-content";

// TODO: Test pagination :)
export default function ShiftItems({
  shifts,
  loading,
  shiftActions,
  pageSize,
  total,
  currentPage,
  emptyMessage = 'No Data',
  setPage,
}: {
  shifts: Shift[] | ShiftBufferRequest[];
  loading: boolean;
  total: number;
  pageSize: number;
  currentPage: number;
  emptyMessage?: string;
  setPage: (page: any) => void;
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
        {shifts.map((shift) => (
          <ShiftItem key={shift.id} shiftActions={shiftActions} shift={shift} />
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
