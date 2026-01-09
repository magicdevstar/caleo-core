import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useParams } from 'react-router';
import { getCenter } from 'geolib';
// @mui
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
// types
import { ShiftData, SHIFTS_FOR_EVENT_DASHBOARD } from 'src/api/shifts';
// hooks
import * as shiftUtils from 'src/utils/shifts';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import QueryView from 'src/components/query-view';
import { IShiftData } from 'src/types/event-dashboard';
import { GET_EVENT_SLIM } from 'src/api/event';
import ShiftTable from 'src/sections/admin/event-management/resource-unit/shift-table/table';
import MapMarkerPopups from 'src/components/map/map-marker-popups';
import { StyledMapContainer } from 'src/components/map';

// ----------------------------------------------------------------------

export default function OperationsUnitDetail() {
  const settings = useSettingsContext();
  const params = useParams();

  const { data: eventData, loading: eventDataLoading } = useQuery(GET_EVENT_SLIM, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      id: params.eventId,
    },
    pollInterval: 1 * 60 * 1000,
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
    const items = data?.shifts?.items;

    const assignedShifts = items?.filter((shift) => !!shift.userId);
    const unassignedShifts = items?.filter((shift) => !shift.userId);

    const awaitingArrival = assignedShifts?.filter(shiftUtils.awaitingArrival);
    const late = assignedShifts?.filter(shiftUtils.late);
    const checkedIn = assignedShifts?.filter(shiftUtils.checkedIn);
    const checkedOut = assignedShifts?.filter(shiftUtils.checkedOut);
    const nowShow = assignedShifts?.filter(shiftUtils.noShow);
    const demobilized = assignedShifts?.filter(shiftUtils.demobilized);

    const markerLocations = shiftUtils.operationsShiftStatus(assignedShifts || []);
    const markerLocationsCenter = getCenter(markerLocations);

    return {
      shifts: {
        items: items || [],
        total: items?.length || 0,
      },
      demobilized: {
        items: demobilized || [],
        total: demobilized?.length || 0,
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
      markerLocationsCenter,
      markerLocations,
    };
  }, [data]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <QueryView
        loading={loading || eventDataLoading}
        error={!!error}
        errorTitle='Failed to Operations Details'
        errorDescription='There was an error loading Operations details. Please try again.'
        refetch={refetch}
      >
        <CustomBreadcrumbs
          heading={`Operations Unit${eventData?.event?.name ? `: ${eventData.event.name}` : ''}`}
          hideLinks={loading}
          links={[
            { name: 'Operations Unit', href: paths.dashboard.admin.eventManagement.operationsTable },
            {
              name: eventData?.event?.name || 'Event Detail',
            },
          ]}
          sx={{ mb: 3 }}
        />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledMapContainer sx={{ mt: 2 }}>
              <MapMarkerPopups
                showHover
                initialViewState={{
                  zoom: 16,
                  latitude: (shiftData.markerLocationsCenter as any)?.latitude,
                  longitude: (shiftData.markerLocationsCenter as any)?.longitude,
                }}
                data={shiftData.markerLocations || []}
              />
            </StyledMapContainer>
          </Grid>
          <ShiftTable
            data={shiftData}
            loading={loading}
            refetch={refetch}
            tableHead={[
              { id: 'refNumber', label: 'Slot Ref #' },
              { id: 'callSign', label: 'Call Sign' },
              { id: 'user.name', label: 'Name' },
              { id: 'assignment.name', label: 'Assignment' },
              { id: 'user.member.rank.name', label: 'Rank' },
              { id: 'user.member.contactInfo.primaryPhone.number', label: 'Phone #' },
              { id: 'hour18', label: '18 Hour' },
              { id: '' },
            ]}
          />
        </Grid>
      </QueryView>
    </Container>
  );
}
