import { useMemo } from "react";
import { useQuery } from "@apollo/client";
// components
// types
import { GET_ALL_SHIFTS, GET_SHIFT_BUFFER_REQUESTS } from "src/api/shifts";
import { Shift, ShiftBufferRequestStatus } from "src/__generated__/resolvers-types";
// utils
import { groupShiftsByEvent } from "src/utils/shifts";
import { TableProps } from "src/components/table";
import { EventCardsView } from "src/components/shifts/groupedByEvent/event-cards-view";

interface Props {
  table: TableProps;
  setFilters: React.Dispatch<any>;
  filters: any;
}

export default function MyOvertimeGroupedByEvent({
  table,
  setFilters,
  filters,
}: Props) {
  const { data, loading } = useQuery(GET_ALL_SHIFTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        ...filters
      },
    }
  });

  const { data: shiftBufferRequests, loading: loadingShiftBuffers } = useQuery(GET_SHIFT_BUFFER_REQUESTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        ...filters,
        status: ShiftBufferRequestStatus.Pending,
      },
    }
  });

  const { shifts: { items } } = data || { shifts: { items: [], total: 0 } };
  const { shiftBufferRequests: { items: bufferItems } } = shiftBufferRequests || { shiftBufferRequests: { items: [] } };


  const groupedShifts = useMemo(() => {
    if (!items || !bufferItems) return {} as Record<string, Shift[]>;
    const sortedItems = [
      ...items,
      ...bufferItems,
    ].sort((a: any, b: any) => {
      const aStart = new Date(a.startTime);
      const bStart = new Date(b.startTime);
      return bStart.getTime() - aStart.getTime();
    });


    return groupShiftsByEvent(sortedItems);
  }, [items, bufferItems]);

  const pagedGroupedShifts = useMemo(() => {
    const pageData: Record<string, Shift[]> = {}
    const skip = (table.page - 1) * table.rowsPerPage;
    const limit = table.rowsPerPage;
    Object.entries(groupedShifts).forEach(([eventId, shifts], index) => {
      if (index >= skip && Object.keys(pageData).length < limit) {
        pageData[eventId] = shifts;
      }
    });
    return pageData;
  }, [groupedShifts, table.page, table.rowsPerPage]);

  const finalLoading = loading || loadingShiftBuffers;

  return (
    <EventCardsView
      loading={finalLoading}
      groupedShifts={pagedGroupedShifts}
      myOvertime
      emptyMessage='No Overtime'

      total={Object.keys(groupedShifts).length}
      pageSize={table.rowsPerPage}
      currentPage={table.page}
      setPage={(page: number) => {
        table.onChangePage(null, page - 1);
        setFilters((c: any) => ({
          ...c,
          skip: (page - 1) * table.rowsPerPage,
        }));
      }}
    />
  );
}
