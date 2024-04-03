import { useMemo } from 'react';
// @apollo/client
import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
// hooks
import { useParams } from 'src/routes/hooks';
import { useFeatures } from 'src/hooks/use-features';
// types
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { GET_GROUPED_SHIFTS, SHIFT_INTEREST_REQUESTS } from 'src/api/shifts';
import QueryView from 'src/components/query-view';
import EditShift from '../events/edit-shift';

// ----------------------------------------------------------------------

export default function ShiftDetail() {
  const { interestLists } = useFeatures();
  const settings = useSettingsContext();
  const params = useParams();

  const { data, refetch, loading, error } = useQuery(GET_GROUPED_SHIFTS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      shiftId: params.shiftId,
    },
    skip: !params.shiftId || params.shiftId === 'new',
  });

  const { data: shiftInterestRequests } = useQuery(SHIFT_INTEREST_REQUESTS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        shiftGroupId: params.shiftId,
      }
    },
    skip: !params.shiftId || params.shiftId === 'new' || !interestLists,
  });

  const assignmentLink = useMemo(() =>
    paths.dashboard.admin.overtime.eventAssignmentDetail.replace(':eventId', params?.eventId || '').replace(':assignmentId', params?.assignmentId || ''),
  [params]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Shift Detail"
        hideLinks={loading}
        links={[
          { name: 'Events', href: paths.dashboard.admin.overtime.events },
          {
            name: data?.groupedShifts?.[0]?.event?.name || 'Event Detail',
            href: paths.dashboard.admin.overtime.eventDetail.replace(':eventId', params?.eventId || ''),
          },
          {
            name: data?.groupedShifts?.[0]?.assignment?.name || 'Assignment Detail',
            href: assignmentLink,
          },
          {
            name: 'Shift Detail',
          },
        ]}
        sx={{ mb: 3 }}
      />

      <QueryView
        loading={loading}
        error={!!error}
        errorTitle='Failed to Load Shift'
        errorDescription='There was an error loading Shift details. Please try again.'
        refetch={refetch}
      >
        <EditShift
          eventId={params.eventId!}
          assignmentId={params.assignmentId!}
          currentShifts={data?.groupedShifts || []}
          backLink={assignmentLink}
          shiftInterestRequests={shiftInterestRequests?.shiftInterestRequests?.items || []}
          shiftId={params.shiftId === 'new' ? undefined : params.shiftId}
        />
      </QueryView>
    </Container>
  );
}
