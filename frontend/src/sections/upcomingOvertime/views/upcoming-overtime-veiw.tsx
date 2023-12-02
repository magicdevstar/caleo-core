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
import ShiftItems from 'src/components/shifts/shift-items';

// ----------------------------------------------------------------------

export default function UpcomingOvertimeView() {
  const table = useTable({
    defaultOrderBy: 'startTime',
    defaultRowsPerPage: 10000,
    defaultOrder: 'asc',
  });
  const [filters, setFilters] = useState<any>({
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

  const { availableShifts: { items, total } } = data || { availableShifts: { items: [], total: 0 } };

  return (
    <Container sx={{
      height: '100%',
    }} maxWidth={settings.themeStretch ? false : 'lg'}>
      <Box sx={{mb: { xs: 3, md: 5 }}}>
        <Typography variant="h4" gutterBottom>
          Available Overtime
        </Typography>
      </Box>

      <ShiftItems
        emptyMessage='No Upcoming Overtime Shifts - Check Back Later'
        pageSize={table.rowsPerPage}
        total={total}
        setPage={(page: number) => {
          table.onChangePage(null, page - 1);
          setFilters((c: any) => ({
            ...c,
            skip: (page - 1) * table.rowsPerPage,
          }));
        }}
        currentPage={table.page + 1}
        shifts={items}
        shiftActions={[]}
        loading={loading}
      />
    </Container>
  );
}
