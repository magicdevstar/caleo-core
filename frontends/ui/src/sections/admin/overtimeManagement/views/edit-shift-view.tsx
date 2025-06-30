import { useMemo } from 'react';
// @apollo/client
import { useQuery } from '@apollo/client';
// @mui
import Container from '@mui/material/Container';
// hooks
import { useParams } from 'src/routes/hooks';
import { useFeatures } from 'src/hooks/use-features';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';
// types
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { GET_GROUPED_SHIFTS, SHIFT_INTEREST_REQUESTS } from 'src/api/shifts';
import QueryView from 'src/components/query-view';
import { GET_ASSIGNMENT_SIGNING_AUTHORITY } from 'src/api/assignment';
import EditShift from '../events/edit-shift';

// ----------------------------------------------------------------------

const timezoneValues: Record<string, number> = {
  'America/New_York': 5,
  'America/Chicago': 6,
  'America/Denver': 7,
  'America/Los_Angeles': 8
}

export default function ShiftDetail() {
  const { user } = useAuthContext();
  const { interestLists, signingAuthorityAssignment } = useFeatures();
  const settings = useSettingsContext();
  const params = useParams();

  const { data: assignmentData } = useQuery(GET_ASSIGNMENT_SIGNING_AUTHORITY, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      id: params.assignmentId,
    },
    skip: !signingAuthorityAssignment,
  });

  const { data, refetch, loading, error } = useQuery(GET_GROUPED_SHIFTS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      shiftId: params.shiftId,
    },
    skip: !params.shiftId || params.shiftId === 'new',
  });

  const shiftStart = data?.groupedShifts?.[0]?.startTime ? new Date(data?.groupedShifts?.[0]?.startTime) : 0;

  const { data: shiftInterestRequests } = useQuery(SHIFT_INTEREST_REQUESTS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        shiftGroupId: params.shiftId,
      },
      shiftStart,
      // This way we show the number of hours for the month excluding the current shift
      // this makes it easier to understand why someone was assigned a shift over someone else
      ignoreShiftId: params.shiftId,
      timezoneOffset: timezoneValues[user?.member?.org?.timezone || 'America/Los_Angeles'],
    },
    skip: !params.shiftId || params.shiftId === 'new' || !interestLists || !shiftStart,
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
          isSigningAuthority={assignmentData?.assignment?.isSigningAuthority || false}
          eventId={params.eventId!}
          refetch={refetch}
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
