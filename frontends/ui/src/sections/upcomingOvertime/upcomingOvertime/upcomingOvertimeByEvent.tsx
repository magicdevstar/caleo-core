import { useState } from 'react';
import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
// components
import { useSettingsContext } from 'src/components/settings';
import { useTable } from 'src/components/table';
import { GET_AVAILABLE_SHIFTS } from 'src/api/shifts';
import { groupShiftsByEvent } from 'src/utils/shifts';
import { EventCardLoading } from 'src/components/shifts/groupedByEvent/event-card-loading';
import EmptyContent from 'src/components/empty-content';
import { EventCard } from 'src/components/shifts/groupedByEvent/event-card';

// ----------------------------------------------------------------------

export default function UpcomingOvertimeByEvent() {
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
    upcoming: true,
  });
  const settings = useSettingsContext();
  const { data, loading } = useQuery(GET_AVAILABLE_SHIFTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: filters,
    }
  });

  const groupedShifts = groupShiftsByEvent(data?.availableShifts?.items);

  return (
    <Container sx={{
      height: '100%',
    }} maxWidth={settings.themeStretch ? false : 'lg'}>
      <Box sx={{mb: { xs: 3, md: 5 }}}>
        <Typography variant="h4" gutterBottom>
          Upcoming Overtime
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
          <EmptyContent filled title='No Upcoming Overtime Shifts - Check Back Later' sx={{ py: 10, mt: 2 }} />
        ) : (
          Object.entries(groupedShifts).map(([eventId, shifts]) => (
            <EventCard key={eventId} shifts={shifts} isUpcoming />
          ))
        )
      }
    </Container>
  );
}
