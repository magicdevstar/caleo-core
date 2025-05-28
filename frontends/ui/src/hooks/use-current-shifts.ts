import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { Dayjs } from 'dayjs';
import { useTheme } from '@mui/material/styles';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// types
import { EventStatus, Shift, ShiftBufferRequestStatus } from 'src/__generated__/resolvers-types';
import { GET_ALL_SHIFTS, GET_AVAILABLE_SHIFTS, GET_SHIFT_BUFFER_REQUESTS } from 'src/api/shifts';
import { useAvailableOvertimeLabels } from './use-available-overtime-labels';

export enum CurrentShiftType {
  Overview = 'OVERVIEW',
  Assigned = 'ASSIGNED',
  Available = 'AVAILABLE',
  Upcoming = 'UPCOMING',
  Secured = 'SECURED',
}

type CurrentShiftProps = {
  type?: CurrentShiftType;
  order?: string;
  limit?: number;
  orderBy?: string;
  skip?: number;
  skillIds?: string[];
  range?: [Dayjs | null, Dayjs | null];
};

export function useCurrentShifts({
  type = CurrentShiftType.Assigned,
  order = 'asc',
  limit = 1000,
  orderBy = 'startTime',
  skip = 0,
  skillIds,
  range,
}: CurrentShiftProps = {}) {
  const { user } = useAuthContext();
  const { labels } = useAvailableOvertimeLabels();
  const theme = useTheme();
  const [shiftTotals, setShiftTotals] = useState({
    [CurrentShiftType.Overview]: 0,
    [CurrentShiftType.Assigned]: 0,
    [CurrentShiftType.Secured]: 0,
    [CurrentShiftType.Available]: 0,
    [CurrentShiftType.Upcoming]: 0,
  });
  const [currentTime] = useState(new Date().toISOString());
  const dateRange = useMemo(
    () =>
      range?.[0] && range?.[1]
        ? [range[0].toDate().getTime(), range[1].toDate().getTime()]
        : undefined,
    [range]
  );

  const {
    data: assignedShiftsData,
    loading: assignedShiftsLoading,
    error: assignedShiftsError,
    refetch: refetchAssignedShifts,
  } = useQuery(GET_ALL_SHIFTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        userId: user?.id,
        startTime: currentTime,
      },
    },
  });
  const {
    data: pastAssignedShiftsData,
    loading: pastAssignedShiftsLoading,
    error: pastAssignedShiftsError,
    refetch: refetchPastAssignedShifts,
  } = useQuery(GET_ALL_SHIFTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        userId: user?.id,
        endTime: currentTime,
        limit: 1000,
      },
    },
  });

  const {
    data: shiftBufferRequestsData,
    loading: shiftBufferRequestsLoading,
    error: shiftBufferRequestsError,
    refetch: refetchShiftBufferRequests,
  } = useQuery(GET_SHIFT_BUFFER_REQUESTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        userId: user?.id,
        startTime: currentTime,
        status: ShiftBufferRequestStatus.Pending,
      },
    },
  });
  const {
    data: availableShiftsData,
    loading: availableShiftsLoading,
    error: availableShiftsError,
    refetch: refetchAvailableShifts,
  } = useQuery(GET_AVAILABLE_SHIFTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {},
    },
  });
  const {
    data: upcomingShiftsData,
    loading: upcomingShiftsLoading,
    error: upcomingShiftsError,
    refetch: refetchUpcomingShifts,
  } = useQuery(GET_AVAILABLE_SHIFTS, {
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        upcoming: true,
      },
    },
  });

  useEffect(() => {
    setShiftTotals((c) => {
      const shiftBufferRequestTotal = shiftBufferRequestsData?.shiftBufferRequests?.total || 0;
      const assignedShiftTotal = assignedShiftsData?.shifts?.total || 0;
      const assigned = assignedShiftTotal + shiftBufferRequestTotal;

      const secured = pastAssignedShiftsData?.shifts?.total || 0;

      const available = availableShiftsData?.availableShifts?.total || 0;

      const upcoming = upcomingShiftsData?.availableShifts?.total || 0;

      const overview = assigned + secured + available + upcoming || 0;

      return {
        [CurrentShiftType.Overview]: overview || c[CurrentShiftType.Overview],
        [CurrentShiftType.Assigned]: assigned || c[CurrentShiftType.Assigned],
        [CurrentShiftType.Secured]: secured || c[CurrentShiftType.Secured],
        [CurrentShiftType.Available]: available || c[CurrentShiftType.Available],
        [CurrentShiftType.Upcoming]: upcoming || c[CurrentShiftType.Upcoming],
      };
    })
  }, [assignedShiftsData, pastAssignedShiftsData, shiftBufferRequestsData, availableShiftsData, upcomingShiftsData]);

  const currentShiftsLoading = useMemo(
    () =>
      assignedShiftsLoading ||
      pastAssignedShiftsLoading ||
      shiftBufferRequestsLoading ||
      availableShiftsLoading ||
      upcomingShiftsLoading,
    [
      assignedShiftsLoading,
      pastAssignedShiftsLoading,
      shiftBufferRequestsLoading,
      availableShiftsLoading,
      upcomingShiftsLoading,
    ]
  );
  const currentShiftsError = useMemo(
    () =>
      assignedShiftsError ||
      pastAssignedShiftsError ||
      shiftBufferRequestsError ||
      availableShiftsError ||
      upcomingShiftsError,
    [
      assignedShiftsError,
      pastAssignedShiftsError,
      shiftBufferRequestsError,
      availableShiftsError,
      upcomingShiftsError
    ]
  );

  // Refresh data when we move tabs
  useEffect(() => {
    switch (type) {
      case CurrentShiftType.Overview:
        refetchShiftBufferRequests();
        refetchAssignedShifts();
        refetchPastAssignedShifts();
        refetchAvailableShifts();
        refetchUpcomingShifts();
        break;
      case CurrentShiftType.Assigned:
        refetchShiftBufferRequests();
        refetchAssignedShifts();
        break;
      case CurrentShiftType.Secured:
        refetchPastAssignedShifts();
        break;
      case CurrentShiftType.Available:
        refetchAvailableShifts();
        break;
      case CurrentShiftType.Upcoming:
        refetchUpcomingShifts();
        break;
      default:
        break;
    }
  }, [
    refetchPastAssignedShifts,
    refetchAssignedShifts,
    refetchShiftBufferRequests,
    refetchAvailableShifts,
    refetchUpcomingShifts,
    type,
  ]);

  const refetchCurrentShifts = useCallback(() => {
    switch (type) {
      case CurrentShiftType.Overview:
        refetchShiftBufferRequests();
        refetchAssignedShifts();
        refetchPastAssignedShifts();
        refetchAvailableShifts();
        refetchUpcomingShifts();
        break;
      case CurrentShiftType.Assigned:
        refetchShiftBufferRequests();
        refetchAssignedShifts();
        break;
      case CurrentShiftType.Secured:
        refetchPastAssignedShifts();
        break;
      case CurrentShiftType.Available:
        refetchAvailableShifts();
        break;
      case CurrentShiftType.Upcoming:
        refetchUpcomingShifts();
        break;
      default:
        break;
    }
  }, [
    refetchPastAssignedShifts,
    refetchAssignedShifts,
    refetchShiftBufferRequests,
    refetchAvailableShifts,
    refetchUpcomingShifts,
    type,
  ]);

  const shiftList = useMemo(() => {
    if (currentShiftsLoading || currentShiftsError) {
      return [];
    }

    const assignedShifts = (assignedShiftsData?.shifts?.items || []).map((shift: any) => ({
      ...shift,
      color: theme.palette.success.main,
      prefixText: 'Assigned',
      prefixColor: 'success',
    }));
    const pastAssignedShifts = (pastAssignedShiftsData?.shifts?.items || []).map((shift: any) => ({
      ...shift,
      color: theme.palette.grey[800],
      prefixText: 'Past',
      prefixColor: 'default',
    }));
    const shiftBufferRequests = (shiftBufferRequestsData?.shiftBufferRequests?.items || []).map((shift: any) => ({
      ...shift,
      color: theme.palette.warning.main,
      prefixText: 'Assigned',
      prefixColor: 'success',
    }));
    const availableShifts = (availableShiftsData?.availableShifts?.items || []).map((shift: any) => ({
      ...shift,
      color: labels[0].getHex(shift),
      prefixText: labels[0].getLabel(shift),
      prefixColor: labels[0].getColor(shift),
    }));
    const upcomingShifts = (upcomingShiftsData?.availableShifts?.items || []).map((shift: any) => ({
      ...shift,
      color: shift.event?.status === EventStatus.ReadyForLottery ? theme.palette.success.dark : theme.palette.primary.main,
      prefixText: 'Upcoming',
      prefixColor: 'primary',
    }));

    const results = [
      ...([CurrentShiftType.Overview, CurrentShiftType.Assigned].includes(type)
        ? [...assignedShifts, ...shiftBufferRequests]
        : []),
      ...([CurrentShiftType.Overview, CurrentShiftType.Secured].includes(type) ? pastAssignedShifts : []),
      ...([CurrentShiftType.Overview, CurrentShiftType.Available].includes(type) ? availableShifts : []),
      ...([CurrentShiftType.Overview, CurrentShiftType.Upcoming].includes(type) ? upcomingShifts : []),
    ];

    if (orderBy === 'startTime') {
      results.sort((a: any, b: any) => {
        const aStart = new Date(a.startTime);
        const bStart = new Date(b.startTime);
        if (order === 'desc') {
          return bStart.getTime() - aStart.getTime();
        }
        return aStart.getTime() - bStart.getTime();
      });
    }
    if (skillIds?.length || dateRange) {
      return results.filter((shift: Shift) => {
        if (skillIds?.length) {
          const hasSkill = (skillIds || []).some((id) =>
            (shift?.assignment?.requiredSkills || []).some((reqSkill) => reqSkill?.id === id)
          );
          if (!hasSkill) {
            return false;
          }
        }
        if (dateRange) {
          const shiftStartTime = new Date(shift?.startTime)?.getTime() || 0;

          if (shiftStartTime < dateRange[0] || shiftStartTime > dateRange[1]) {
            return false;
          }
        }
        return true;
      });
    }
    return results;
  }, [
    labels,
    assignedShiftsData,
    pastAssignedShiftsData,
    shiftBufferRequestsData,
    availableShiftsData,
    upcomingShiftsData,
    currentShiftsLoading,
    currentShiftsError,
    type,
    order,
    orderBy,
    skillIds,
    dateRange,
    theme
  ]);

  // Paged Shifts
  const currentShifts = useMemo(() => shiftList.slice(skip, skip + limit), [shiftList, skip, limit]);

  return {
    allCurrentShifts: shiftList, // All currently loaded shifts without paging
    currentShifts, // paged shifts (if paging is enabled)
    shiftTotals, // length of all currently loaded shifts since filters are local
    loading: currentShiftsLoading,
    error: currentShiftsError,
    refetch: refetchCurrentShifts,
  };
}
