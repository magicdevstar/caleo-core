import { useMemo, useState } from 'react';
import { setMilliseconds, setSeconds } from 'date-fns';
// @mui
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
// hooks
import { useQuery } from '@apollo/client';
import { useParams } from 'src/routes/hooks';
// components
import QueryView from 'src/components/query-view';
// types
import { ShiftData, SHIFTS_FOR_EVENT_DASHBOARD } from 'src/api/shifts';
import { IShiftData } from 'src/types/event-dashboard';
import Analytics from '../event/analytics';
import ShiftTable from '../event/shift-table/table';
import Actions, { IActions } from '../event/header/actions';

const truncateToMinute = (date: Date) =>
  setSeconds(setMilliseconds(date, 0), 0);

export default function EventDashboardView() {
  const params = useParams();
  const [filters, setFilters] = useState<IActions>({
    divisionIds: [],
  });

  const {
    data,
    refetch,
    loading,
    error,
  } = useQuery<ShiftData>(SHIFTS_FOR_EVENT_DASHBOARD, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        limit: 100000,
        skip: 0,
        orderBy: 'startTime',
        order: 'asc',
        eventIds: [params.eventId],
      }
    },
    pollInterval: 1 * 60 * 1000 * 2,
  });

  const shiftData: IShiftData = useMemo(() => {
    let items = data?.shifts?.items;
    if (filters.divisionIds.length > 0) {
      items = data?.shifts?.items?.filter((shift) => 
        filters.divisionIds.includes(shift.user?.member?.divisionId || '')
      );
    }

    const assignedShifts = items?.filter((shift) => !!shift.userId);
    const unassignedShifts = items?.filter((shift) => !shift.userId);

    const awaitingArrival = assignedShifts?.filter((shift) =>
      !!shift.userId &&
      !shift.shiftCheckInOut?.noShow &&
      !shift.shiftCheckInOut?.checkInTime &&
      !shift.shiftCheckInOut?.checkOutTime &&
      truncateToMinute(new Date(shift.startTime)) >= truncateToMinute(new Date())
    );

    const late = assignedShifts?.filter((shift) => {
      const baseConditions = !!shift.userId && !shift.shiftCheckInOut?.noShow;

      if (shift.shiftCheckInOut?.checkInTime) {
        return baseConditions && (truncateToMinute(new Date(shift.shiftCheckInOut?.checkInTime)) > truncateToMinute(new Date(shift.startTime)));
      }

      return baseConditions && truncateToMinute(new Date(shift.startTime)) <= truncateToMinute(new Date());
    });

    const checkedIn = assignedShifts?.filter((shift) =>
      !!shift.userId &&
      !shift.shiftCheckInOut?.noShow &&
      !!shift.shiftCheckInOut?.checkInTime &&
      !shift.shiftCheckInOut?.checkOutTime
    );

    const checkedOut = assignedShifts?.filter((shift) =>
      !!shift.userId &&
      !shift.shiftCheckInOut?.noShow &&
      !!shift.shiftCheckInOut?.checkInTime &&
      !!shift.shiftCheckInOut?.checkOutTime
    );

    const nowShow = assignedShifts?.filter((shift) =>
      !!shift.userId &&
      !!shift.shiftCheckInOut?.noShow
    );

    return {
      shifts: {
        items: items || [],
        total: items?.length || 0,
      },
      assignedShifts: {
        items: assignedShifts || [],
        total: assignedShifts?.length || 0,
      },
      unassignedShifts: {
        items: unassignedShifts || [],
        total: unassignedShifts?.length || 0,
      },
      awaitingArrival: {
        items: awaitingArrival || [],
        total: awaitingArrival?.length || 0,
      },
      checkedIn: {
        items: checkedIn || [],
        total: checkedIn?.length || 0,
      },
      checkedOut: {
        items: checkedOut || [],
        total: checkedOut?.length || 0,
      },
      noShow: {
        items: nowShow || [],
        total: nowShow?.length || 0,
      },
      late: {
        items: late || [],
        total: late?.length || 0,
      },
    };
  }, [filters, data]);

  return (
    <Container
      component="main"
      sx={{
        height: 'calc(100vh - 80px)',
      }}
      maxWidth='xl'
    >
      <QueryView
        loading={loading}
        error={!!error}
        errorTitle='Failed to Load Event Dashboard'
        errorDescription='There was an error loading Event dashboard. Please try again.'
        refetch={refetch}
      >
        <Grid container spacing={3} mb={2}>
          <Grid item xs={12} md={6}>
            <Typography variant='h3' component='h1' gutterBottom>{shiftData?.shifts?.items?.[0]?.event?.name}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Actions eventId={params.eventId!} refetch={refetch} setFilters={setFilters} />
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Analytics data={shiftData} />

          <ShiftTable data={shiftData} loading={loading} />
        </Grid>
      </QueryView>
    </Container>
  )
}
