import isNumber from 'lodash/isNumber';
// @mui
import Pagination, { paginationClasses } from "@mui/material/Pagination";
// Components
import EmptyContent from "src/components/empty-content";
import { EventCardLoading } from "src/components/shifts/groupedByEvent/event-card-loading";
import { EventCard } from "src/components/shifts/groupedByEvent/event-card";
// Types
import { Shift } from "src/__generated__/resolvers-types";

interface Props {
  groupedShifts: Record<string, Shift[]>;
  loading: boolean;

  // Event card passthrough
  myOvertime?: boolean;
  isUpcoming?: boolean;

  // Optional props
  emptyMessage?: string;

  // Pagination props
  total?: number;
  pageSize?: number;
  currentPage?: number;
  setPage?: (page: any) => void;
}

export function EventCardsView({
  loading,
  groupedShifts,

  myOvertime,
  isUpcoming,

  emptyMessage = 'No overtime',

  total,
  pageSize,
  currentPage,
  setPage,
}: Props) {
  if (loading) {
    return (
      <>
        <EventCardLoading />
        <EventCardLoading />
      </>
    );
  }

  if (Object.keys(groupedShifts).length === 0) {
    return <EmptyContent filled title={emptyMessage} sx={{ py: 10, mt: 2 }} />
  }

  return (
    <>
      {
        Object.entries(groupedShifts).map(([eventId, shifts]) => (
          <EventCard
            key={eventId}
            items={shifts}
            myOvertime={myOvertime}
            isUpcoming={isUpcoming || (shifts[0] as any).prefixText === 'Upcoming'}
          />
        ))
      }

      {isNumber(total) && isNumber(pageSize) && total > pageSize && (
        <Pagination
          count={Math.ceil(total / pageSize)}
          page={currentPage}
          onChange={(_event, page) => setPage?.(page)}
          sx={{
            mt: 1,
            mb: 3,
            [`& .${paginationClasses.ul}`]: {
              justifyContent: 'center',
            },
          }}
        />
      )}
    </>
  );
};
