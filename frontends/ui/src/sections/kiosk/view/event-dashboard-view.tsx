import { useMemo, useState } from 'react';
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
import Analytics from '../event/analytics';
import ShiftTable from '../event/shift-table/table';
import Actions, { IActions } from '../event/header/actions';

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

  const shiftData = useMemo(() => {
    let items = data?.shifts?.items;
    if (filters.divisionIds.length > 0) {
      items = data?.shifts?.items?.filter((shift) => 
        filters.divisionIds.includes(shift.user?.member?.divisionId || '')
      );
    }
    return {
      shifts: {
        items: items || [],
        total: items?.length || 0,
      }
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

          <ShiftTable refetch={refetch} data={shiftData?.shifts?.items} totalData={shiftData?.shifts?.total || 0} loading={loading} />
        </Grid>
      </QueryView>
    </Container>
  )
}
