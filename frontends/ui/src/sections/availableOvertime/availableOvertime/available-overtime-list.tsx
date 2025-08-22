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
import { EventStatus, Shift } from 'src/__generated__/resolvers-types';
import { useBoolean } from 'src/hooks/use-boolean';
import ShiftItems from 'src/components/shifts/shift-items';
import { useResponsive } from 'src/hooks/use-responsive';
import InterestDialog from 'src/components/shifts/confirmations/interest-dialog';
import { useAvailableOvertimeLabels } from 'src/hooks/use-available-overtime-labels';
import ShiftAssignmentConfirmation from 'src/components/shifts/confirmations/shift-assignment-confirmation';

// ----------------------------------------------------------------------

export default function AvailableOvertimeList() {
  const { labels } = useAvailableOvertimeLabels();
  const mdDown = useResponsive('down', 'md');

  const assignConfirm = useBoolean<Shift>();
  const interestConfirm = useBoolean<Shift>();
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
  });
  const settings = useSettingsContext();

  const { data, loading } = useQuery(GET_AVAILABLE_SHIFTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        ...filters
      },
    }
  });

  const { availableShifts: { items, total } } = data || { availableShifts: { items: [], total: 0 } };

  const shiftActions = [
    {
      key: 'signUp',
      disabled: (shift: Shift) => false,
      color: (shift: Shift) =>
        shift.shiftInterestRequest?.id ? 'error' : 'info',
      onClick: (shift: Shift) => {
        if (shift.event.status === EventStatus.InterestList) {
          interestConfirm.onTrue(shift);
        } else {
          assignConfirm.onTrue(shift);
        }
      },
      getIcon: (shift: Shift) => {
        if (shift.event.status === EventStatus.InterestList) {
          if (shift.shiftInterestRequest?.id) {
            return 'ic:round-cancel';
          }
          return 'ic:round-front-hand';
        }
        return 'mdi:clipboard-check';
      },
      getName: (shift: Shift) => {
        if (shift.event.status === EventStatus.InterestList) {
          return shift.shiftInterestRequest?.id ? 'Remove Interest' : 'Show Interest';
        }
        return 'Sign Up';
      },
    }
  ];

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
        emptyMessage='No Overtime Shifts Available - Check Back Later'
        pageSize={table.rowsPerPage}
        compact={mdDown}
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
        shiftActions={shiftActions}
        shiftLabels={labels}
        loading={loading}
      />

      <ShiftAssignmentConfirmation confirm={assignConfirm} />
      <InterestDialog confirm={interestConfirm} />
    </Container>
  );
}
