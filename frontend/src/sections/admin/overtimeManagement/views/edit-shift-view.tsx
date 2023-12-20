import { useMemo } from 'react';
// @apollo/client
import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
// hooks
import { useParams } from 'src/routes/hooks';
// types
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { GET_GROUPED_SHIFTS } from 'src/api/shifts';
import QueryView from 'src/components/query-view';
import EditShift from '../events/edit-shift';

// ----------------------------------------------------------------------

export default function ShiftDetail() {
  const settings = useSettingsContext();
  const params = useParams();

  const { data, refetch, loading, error } = useQuery(GET_GROUPED_SHIFTS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    notifyOnNetworkStatusChange: true,
    variables: {
      shiftId: params.shiftId,
    },
    skip: !params.shiftId || params.shiftId === 'new',
  });

  const assignmentLink = useMemo(() =>
    paths.dashboard.admin.overtime.eventAssignmentDetail.replace(':eventId', params?.eventId || '').replace(':assignmentId', params?.assignmentId || ''),
  [params]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Event Detail"
        links={[
          { name: 'Events', href: paths.dashboard.admin.overtime.events },
          {
            name: 'Event Detail',
            href: paths.dashboard.admin.overtime.eventDetail.replace(':eventId', params?.eventId || ''),
          },
          {
            name: 'Assignment Detail',
            href: assignmentLink,
          },
          {
            name: 'Shift Detail',
          },
        ]}
        sx={{ mb: 1 }}
      />

      <QueryView
        loading={loading}
        error={!!error}
        errorTitle='Failed to Load Shift'
        errorDescription='There was an error loading Shift details. Please try again.'
        onRetry={refetch}
      >
        <EditShift
          eventId={params.eventId!}
          assignmentId={params.assignmentId!}
          currentShifts={data?.groupedShifts || []}
          backLink={assignmentLink}
          shiftId={params.shiftId === 'new' ? undefined : params.shiftId}
        />
      </QueryView>
    </Container>
  );
}
