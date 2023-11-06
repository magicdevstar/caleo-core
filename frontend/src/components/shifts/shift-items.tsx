// @mui
import Grid from "@mui/material/Grid";
import Pagination, { paginationClasses } from "@mui/material/Pagination";
import { Shift } from "src/__generated__/resolvers-types";
// components
import ShiftItem from "./shift-item";
import ShiftItemSkeleton from "./shift-item-skeleton";

// TODO: Test pagination :)
export default function ShiftItems({
  shifts,
  loading,
  shiftActions,
  pageSize,
  total,
  currentPage,
  setPage,
}: {
  shifts: Shift[];
  loading: boolean;
  total: number;
  pageSize: number;
  currentPage: number;
  setPage: (page: any) => void;
  shiftActions: {
    key: string;
    onClick: (shift: Shift) => void;
    getIcon: (shift: Shift) => string;
    getName: (shift: Shift) => string;
  }[]
}) {
  const renderSkeleton = (
    <>
      {[...Array(16)].map((_, index) => (
        <ShiftItemSkeleton key={index} />
      ))}
    </>
  );

  const renderList = (
    <>
      {shifts.map((shift) => (
        <ShiftItem key={shift.id} shiftActions={shiftActions} shift={shift} />
      ))}
    </>
  );

  return (
    <>
      <Grid container spacing={2} sx={{ padding: '9px' }}>
        {loading ? renderSkeleton : renderList}
      </Grid>

      {shifts.length > pageSize && (
        <Pagination
          count={total}
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
