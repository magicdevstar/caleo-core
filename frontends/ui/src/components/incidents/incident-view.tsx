import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { IncidentForm, IncidentFormStatus, Shift } from "src/__generated__/resolvers-types";
import { useAuthContext } from "src/auth/hooks";
import { cloneDeep } from "lodash";
import { GET_SUBMITTED_INCIDENT_SUBMISSIONS } from "src/api/incidentForm";
import { groupShiftsByEvent } from "src/utils/shifts";
import { useTable } from "../table";
import { EventCardsView } from "../shifts/groupedByEvent/event-cards-view";

interface IncidentQueryResponse {
  incidentForms: {
    items: IncidentForm[];
    total: number;
  }
};

export default function IncidentView({
  userId,
}: {
  userId?: string;
}) {
  const { user } = useAuthContext();
  const userID = userId || user?.id;
  const table = useTable({
    defaultOrderBy: 'startTime',
    defaultRowsPerPage: 10000,
    defaultOrder: 'asc',
  });

  const { data: incidentData, loading: loadingIncidents } = useQuery<IncidentQueryResponse>(GET_SUBMITTED_INCIDENT_SUBMISSIONS, {
      fetchPolicy: 'no-cache', // Used for first execution
      nextFetchPolicy: 'cache-first', // Used for subsequent executions
      variables: {
        input: {
          userId: userID,
          limit: 1000,
          status: IncidentFormStatus.Submitted,
        },
      }
    });
  const { incidentForms: { items: incidentItems } } = cloneDeep(incidentData || { incidentForms: { items: [], total: 0 } });

  const groupedShifts = useMemo(() => {
    const allItems: Shift[] = [...(incidentItems || [])] as any;
    if (allItems.length === 0) return {} as Record<string, Shift[]>;
    return groupShiftsByEvent(allItems);
  }, [incidentItems]);
  
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
      loading={loadingIncidents}
      groupedShifts={pagedGroupedShifts}
      myOvertime
      emptyMessage='No Incident Submissions found'

      total={Object.keys(groupedShifts).length}
      pageSize={table.rowsPerPage}
      currentPage={table.page}
      setPage={(page: number) => {
        table.onChangePage(null, page - 1);
      }}
    />
  );
};
