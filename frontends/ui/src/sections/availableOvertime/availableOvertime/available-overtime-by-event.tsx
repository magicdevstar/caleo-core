import { useState } from 'react';
import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
// components
import { useSettingsContext } from 'src/components/settings';
import { useTable } from 'src/components/table';
import { GET_ALL_SHIFTS, GET_AVAILABLE_SHIFTS, GET_SHIFT_BUFFER_REQUESTS } from 'src/api/shifts';
import { EventCard } from 'src/components/shifts/groupedByEvent/event-card';
import { EventCardLoading } from 'src/components/shifts/groupedByEvent/event-card-loading';
import EmptyContent from 'src/components/empty-content/empty-content';
// utils
import { groupShiftsByEvent } from 'src/utils/shifts';
import { useAuthContext } from 'src/auth/hooks';
import { Shift, ShiftBufferRequest, ShiftBufferRequestStatus } from 'src/__generated__/resolvers-types';

// ----------------------------------------------------------------------

export default function AvailableOvertimeByEvent() {
  const [currentTime] = useState(new Date().toISOString());
  const { user } = useAuthContext();
  const table = useTable({
    defaultOrderBy: 'startTime',
    defaultRowsPerPage: 10000,
    defaultOrder: 'asc',
  });
  const [filters] = useState<any>({
    limit: table.rowsPerPage,
    skip: table.page * table.rowsPerPage,
    orderBy: table.orderBy,
    order: table.order,
  });
  const settings = useSettingsContext();

  const {
    data: assignedShiftsData,
    loading: assignedShiftsLoading,
  } = useQuery(GET_ALL_SHIFTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        userId: user?.id,
        startTime: currentTime,
      },
    },
  });

  const {
    data: shiftBufferRequestsData,
    loading: shiftBufferRequestsLoading,
  } = useQuery(GET_SHIFT_BUFFER_REQUESTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        userId: user?.id,
        startTime: currentTime,
        status: ShiftBufferRequestStatus.Pending,
      },
    },
  });

  const { data, loading: availableShiftsLoading } = useQuery(GET_AVAILABLE_SHIFTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        ...filters
      },
    }
  });

  const loading = assignedShiftsLoading || shiftBufferRequestsLoading || availableShiftsLoading;
  
  // Create a Map to handle duplicates with priority order
  const shiftsMap = new Map();
  
  // Add available shifts first (lowest priority)
  (data?.availableShifts?.items || []).forEach((shift: Shift) => {
    shiftsMap.set(shift.shiftId, shift);
  });
  
  // Add shift buffer requests (medium priority) - will overwrite available shifts
  (shiftBufferRequestsData?.shiftBufferRequests?.items || []).forEach((shift: ShiftBufferRequest) => {
    shiftsMap.set(shift.shiftGroupId, {...shift, prefixText: 'Assigned'});
  });
  
  // Add assigned shifts (highest priority) - will overwrite any previous entries
  (assignedShiftsData?.shifts?.items || []).forEach((shift: Shift) => {
    shiftsMap.set(shift.shiftId, {...shift, prefixText: 'Assigned'});
  });
  
  // Convert Map back to array
  const allItems = Array.from(shiftsMap.values());

  const groupedShifts = groupShiftsByEvent(allItems);

  return (
    <Container
      sx={{
        height: '100%',
        mb: 3
      }}
      maxWidth={settings.themeStretch ? false : 'lg'}
    >
      <Box sx={{mb: { xs: 3, md: 5 }}}>
        <Typography variant="h4" gutterBottom>
          Available Overtime
        </Typography>
      </Box>
      {
        loading && (
          <>
            <EventCardLoading />
            <EventCardLoading />
          </>
        )
      }
      {
        !loading && Object.keys(groupedShifts).length === 0 ? (
          <EmptyContent filled title='No Overtime Shifts Available - Check Back Later' sx={{ py: 10, mt: 2 }} />
        ) : (
          Object.entries(groupedShifts).map(([eventId, shifts]) => (
            <EventCard key={eventId} shifts={shifts} />
          ))
        )
      }
    </Container>
  );
}
