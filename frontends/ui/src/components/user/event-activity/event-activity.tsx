import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
// @mui
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
// components
// types
import { GET_ACTIVITY, USER_SHIFT_INTEREST_REQUESTS } from "src/api/shifts";
import { EventStatus, IncidentForm, IncidentFormStatus, Shift, ShiftInterestRequest } from "src/__generated__/resolvers-types";
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

interface InterestQueryResponse {
  userShiftInterestRequests: {
    items: ShiftInterestRequest[];
    total: number;
  }
};

export default function EventActivity({
  userId
}: Props) {
  const [eventType, setEventType] = useState<'all' | 'pre-planned' | 'incident'>('all');
  
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

  const { data: interestData, loading: loadingInterests } = useQuery<InterestQueryResponse>(USER_SHIFT_INTEREST_REQUESTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        userId,
        limit: 1000,
      },
    }
  })

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
    const interestRequestShifts: Shift[] = (interestData?.userShiftInterestRequests?.items || [])
      .filter((interest) => interest.shift)
      .map(interest => ({
        ...(interest.shift || {}),
        // This way the actions/labels know it's from an interest request
        event: {
          ...(interest.shift?.event || {}),
          status: EventStatus.InterestList,
        },
        shiftInterestRequest: {
          id: interest.id,
        },
        prefixText: 'UnfulfilledInterestRequest',
      })) as any;

    // Filter items based on selected event type
    let allItems: (Shift | IncidentForm)[] = [];
    
    switch (eventType) {
      case 'pre-planned':
        allItems = [...(items || []), ...(interestRequestShifts || [])];
        break;
      case 'incident':
        allItems = [...(incidentItems || [])];
        break;
      case 'all':
      default:
        allItems = [...(items || []), ...(incidentItems || []), ...(interestRequestShifts || [])];
        break;
    }

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
  }, [items, incidentItems, interestData, eventType]);

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
    <>
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="event-type-select-label">Event Type</InputLabel>
          <Select
            labelId="event-type-select-label"
            id="event-type-select"
            value={eventType}
            label="Event Type"
            onChange={(e) => setEventType(e.target.value as 'all' | 'pre-planned' | 'incident')}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pre-planned">Pre-Planned</MenuItem>
            <MenuItem value="incident">Incident</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <EventCardsView
        loading={loading || loadingIncidents || loadingInterests}
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
    </>
  );
}
