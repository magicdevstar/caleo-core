import { useMemo } from "react";
import { useQuery } from "@apollo/client";
// components
// types
import { GET_ACTIVITY } from "src/api/shifts";
import { IncidentForm, IncidentFormStatus, Shift } from "src/__generated__/resolvers-types";
// utils
import { groupShiftsByEvent } from "src/utils/shifts";
import { useTable } from "src/components/table";
import { EventCardsView } from "src/components/shifts/groupedByEvent/event-cards-view";
import { cloneDeep } from "@apollo/client/utilities";
import { GET_SUBMITTED_INCIDENT_SUBMISSIONS } from "src/api/incidentForm";

interface Props {
  userId: string;
}

interface QueryResponse {
  activityShifts: {
    items: Shift[];
    total: number;
  }
};

interface IncidentQueryResponse {
  incidentForms: {
    items: IncidentForm[];
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

  const { data: incidentData, loading: loadingIncidents } = useQuery<IncidentQueryResponse>(GET_SUBMITTED_INCIDENT_SUBMISSIONS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        userId,
        limit: 1000,
        status: IncidentFormStatus.Submitted,
      },
    }
  });
  const { incidentForms: { items: incidentItems } } = cloneDeep(incidentData || { incidentForms: { items: [], total: 0 } });

  const groupedShifts = useMemo(() => {
    const allItems = [...(items || []), ...(incidentItems || [])];
    if (allItems.length === 0) return {} as Record<string, Shift[]>;

    // Create a Map to handle duplicates with priority order
    const shiftsMap = new Map();
    
    // Add available shifts first (lowest priority)
    allItems.forEach((item: Shift | IncidentForm) => {
      if (item.__typename === 'Shift') {
        shiftsMap.set(item.shiftId, item);
      } else {
        shiftsMap.set(item.id, item);
      }
    });
    
    // Convert Map back to array
    const finalItems = Array.from(shiftsMap.values());

    return groupShiftsByEvent(finalItems);
  }, [items, incidentItems]);

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
      loading={loading || loadingIncidents}
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
