import { useMemo } from "react";
import { useQuery } from "@apollo/client";
// components
// types
import { GET_ACTIVITY } from "src/api/shifts";
import { Shift } from "src/__generated__/resolvers-types";
// utils
import { groupShiftsByEvent } from "src/utils/shifts";
import { useTable } from "src/components/table";
import { EventCardsView } from "src/components/shifts/groupedByEvent/event-cards-view";
import { cloneDeep } from "@apollo/client/utilities";

interface Props {
  userId: string;
}

interface QueryResponse {
  activityShifts: {
    items: Shift[];
    total: number;
  }
};

export default function EventActivity({
  userId
}: Props) {
  const table = useTable({
    defaultOrderBy: 'startTime',
    defaultRowsPerPage: 10000,
    defaultOrder: 'asc',
  });

  const { data, loading } = useQuery<QueryResponse>(GET_ACTIVITY, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      userId,
    }
  });
  const { activityShifts: { items } } = cloneDeep(data || { activityShifts: { items: [], total: 0 } });

  const groupedShifts = useMemo(() => {
    if (!items) return {} as Record<string, Shift[]>;

    // Create a Map to handle duplicates with priority order
    const shiftsMap = new Map();
    
    // Add available shifts first (lowest priority)
    (items || []).forEach((shift: Shift) => {
      shiftsMap.set(shift.shiftId, shift);
    });
    
    // Convert Map back to array
    const finalItems = Array.from(shiftsMap.values());

    return groupShiftsByEvent(finalItems);
  }, [items]);

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

  return (
    <EventCardsView
      loading={loading}
      groupedShifts={pagedGroupedShifts}
      myOvertime
      emptyMessage='No Overtime'

      total={Object.keys(groupedShifts).length}
      pageSize={table.rowsPerPage}
      currentPage={table.page}
      setPage={(page: number) => {
        table.onChangePage(null, page - 1);
      }}
    />
  );
}
