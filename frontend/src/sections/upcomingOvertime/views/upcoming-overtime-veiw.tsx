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
import { EventStatus, Shift } from 'src/__generated__/resolvers-types';
import { convertDate, dateTimeFormat } from 'src/hooks/use-datejs';
import { useAuthContext } from 'src/auth/hooks';
import { useLotteryCounterOptions } from 'src/hooks/use-lottery-counter-options';
import { useResponsive } from 'src/hooks/use-responsive';

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
  const { user } = useAuthContext();
  const mdDown = useResponsive('down', 'md');

  const { options: lotteryCounterOptions } = useLotteryCounterOptions({
    org: user.member.org!,
  });
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
          Upcoming Overtime
        </Typography>
      </Box>

      <ShiftItems
        emptyMessage='No Upcoming Overtime Shifts - Check Back Later'
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
        shiftLabels={[
          {
            key: 'shift-post-date',
            variant: 'soft',
            sx: {
              border: 'none',
              background: 'none',
            },
            getHidden: (shift: Shift) => ![EventStatus.ReadyForLottery, EventStatus.FirstComeFirstServe].includes(shift?.event?.status),
            getLabel: (shift: Shift) => {
              if (shift?.event?.status === EventStatus.ReadyForLottery) {
                const foundCounter = lotteryCounterOptions.find((c) => c.counter === shift?.event?.lotteryNumber);
                if (!foundCounter) {
                  return '';
                }
                return foundCounter?.time;
              }
              if (shift?.event?.status === EventStatus.FirstComeFirstServe) {
                const fcfsDate = convertDate({ date: shift?.event?.scheduledFirstComeFirstServe || '', user });
                return `${fcfsDate.format(dateTimeFormat)}`
              }
              return '';
            }
          },
          {
            key: 'shift-event-status',
            variant: 'soft',
            getHidden: (shift: Shift) => ![EventStatus.ReadyForLottery, EventStatus.FirstComeFirstServe].includes(shift?.event?.status),
            getColor: (shift: Shift) => {
              if (shift?.event?.status === EventStatus.ReadyForLottery) {
                return 'success';
              }
              if (shift?.event?.status === EventStatus.FirstComeFirstServe) {
                return 'primary';
              }
              return 'default';
            },
            getLabel: (shift: Shift) => {
              if (shift?.event?.status === EventStatus.ReadyForLottery) {
                return 'Pre-Lottery';
              }
              if (shift?.event?.status === EventStatus.FirstComeFirstServe) {
                return 'Pre-First Come First Serve';
              }
              return '';
            }
          }
        ]}
        shiftActions={[]}
        loading={loading}
      />
    </Container>
  );
}
