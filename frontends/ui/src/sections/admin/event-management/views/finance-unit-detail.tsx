import { useQuery } from '@apollo/client';
import { useParams } from 'react-router';
// @mui
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
// types
import { GET_ALL_FINANCE_SHIFTS } from 'src/api/shifts';
import { EventStatus } from 'src/__generated__/resolvers-types';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { GET_EVENT_SLIM } from 'src/api/event';
import QueryView from 'src/components/query-view';
import EmptyContent from 'src/components/empty-content';
import AnalyticsDetails from '../finance-unit/analytics-details';
import ReportDetails from '../finance-unit/report-details';

// ----------------------------------------------------------------------

export default function FinanceUnitDetailView() {
  const settings = useSettingsContext();
  const params = useParams();

  const { data: eventData, loading: eventDataLoading } = useQuery(GET_EVENT_SLIM, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      id: params.eventId,
    },
  });

  // TODO: Use this query on the finance dashboard :)
  const { data, loading, error, refetch } = useQuery(GET_ALL_FINANCE_SHIFTS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      eventId: params.eventId,
    },
  });

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <QueryView
        loading={loading || eventDataLoading}
        error={!!error}
        errorTitle='Failed to Event Details'
        errorDescription='There was an error loading Event details. Please try again.'
        refetch={refetch}
      >
        <CustomBreadcrumbs
          heading={`Finance Unit${eventData?.event?.name ? `: ${eventData.event.name}` : ''}`}
          hideLinks={loading}
          links={[
            { name: 'Finance Unit', href: paths.dashboard.admin.eventManagement.financeUnit },
            {
              name: eventData?.event?.name || 'Event Detail',
            },
          ]}
          sx={{ mb: 3 }}
        />
        {
          data?.financeShifts?.length === 0 ? (
            <EmptyContent
              filled
              title='No data available'
              description={
                eventData?.status === EventStatus.Incident ?
                 'Data will be available once a incident submission has been received.' :
                 'Data will be available once a shift has been assigned to an officer.'
              }
            />
          ) : (
            <Grid container spacing={3} mb={6}>
              <AnalyticsDetails data={data?.financeShifts || []} />
              <ReportDetails data={data?.financeShifts || []} event={eventData?.event} />
            </Grid>
          )
        }
      </QueryView>
    </Container>
  );
}
