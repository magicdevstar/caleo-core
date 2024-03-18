import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { Dayjs } from 'dayjs';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// types
import { Shift, ShiftBufferRequestStatus } from 'src/__generated__/resolvers-types';
import { GET_ALL_SHIFTS, GET_AVAILABLE_SHIFTS, GET_SHIFT_BUFFER_REQUESTS } from 'src/api/shifts';

export enum CurrentShiftType {
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
  const [currentTime] = useState(new Date().toISOString());
  const dateRange = useMemo(
    () =>
      range?.[0] && range?.[1]
        ? [range[0].toDate().getTime(), range[1].toDate().getTime()]
        : undefined,
    [range]
  );
  const sharedInputValues = useMemo(
    () => ({
      orderBy,
      order,
    }),
    [orderBy, order]
  );

  const {
    data: assignedShiftsData,
    loading: assignedShiftsLoading,
    error: assignedShiftsError,
    refetch: refetchAssignedShifts,
  } = useQuery(GET_ALL_SHIFTS, {
    skip: ![CurrentShiftType.Assigned, CurrentShiftType.Secured].includes(type),
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        ...sharedInputValues,
        userId: user?.id,
        startTime: type === CurrentShiftType.Secured ? undefined : currentTime,
        endTime: type === CurrentShiftType.Secured ? currentTime : undefined,
      },
    },
  });
  const {
    data: shiftBufferRequestsData,
    loading: shiftBufferRequestsLoading,
    error: shiftBufferRequestsError,
    refetch: refetchShiftBufferRequests,
  } = useQuery(GET_SHIFT_BUFFER_REQUESTS, {
    skip: ![CurrentShiftType.Assigned, CurrentShiftType.Secured].includes(type),
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        ...sharedInputValues,
        userId: user?.id,
        startTime: type === CurrentShiftType.Secured ? undefined : currentTime,
        endTime: type === CurrentShiftType.Secured ? currentTime : undefined,
        status: ShiftBufferRequestStatus.Pending,
        order,
      },
    },
  });
  const {
    data: availableShiftsData,
    loading: availableShiftsLoading,
    error: availableShiftsError,
    refetch: refetchAvailableShifts,
  } = useQuery(GET_AVAILABLE_SHIFTS, {
    skip: ![CurrentShiftType.Available].includes(type),
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        ...sharedInputValues,
        order,
      },
    },
  });
  const {
    data: upcomingShiftsData,
    loading: upcomingShiftsLoading,
    error: upcomingShiftsError,
    refetch: refetchUpcomingShifts,
  } = useQuery(GET_AVAILABLE_SHIFTS, {
    skip: ![CurrentShiftType.Upcoming].includes(type),
    fetchPolicy: 'no-cache', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        ...sharedInputValues,
        upcoming: true,
        order,
      },
    },
  });

  const currentShiftTotal = useMemo(() => {
    switch (type) {
      case CurrentShiftType.Assigned:
      case CurrentShiftType.Secured: {
        const assignedTotal = assignedShiftsData?.shifts?.total || 0;
        const shiftBufferRequestTotal = shiftBufferRequestsData?.shiftBufferRequests?.total || 0;
        return assignedTotal + shiftBufferRequestTotal;
      }
      case CurrentShiftType.Available:
        return availableShiftsData?.availableShifts?.total || 0;
      case CurrentShiftType.Upcoming:
        return upcomingShiftsData?.availableShifts?.total || 0;
      default:
        return 0;
    }
  }, [type, assignedShiftsData, shiftBufferRequestsData, availableShiftsData, upcomingShiftsData]);

  const currentShiftsLoading = useMemo(
    () =>
      assignedShiftsLoading ||
      shiftBufferRequestsLoading ||
      availableShiftsLoading ||
      upcomingShiftsLoading,
    [
      assignedShiftsLoading,
      shiftBufferRequestsLoading,
      availableShiftsLoading,
      upcomingShiftsLoading,
    ]
  );
  const currentShiftsError = useMemo(
    () =>
      assignedShiftsError ||
      shiftBufferRequestsError ||
      availableShiftsError ||
      upcomingShiftsError,
    [assignedShiftsError, shiftBufferRequestsError, availableShiftsError, upcomingShiftsError]
  );

  const refetchCurrentShifts = useCallback(() => {
    switch (type) {
      case CurrentShiftType.Assigned:
      case CurrentShiftType.Secured:
        refetchAssignedShifts();
        refetchShiftBufferRequests();
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
    refetchAssignedShifts,
    refetchShiftBufferRequests,
    refetchAvailableShifts,
    refetchUpcomingShifts,
    type,
  ]);

  const shiftList = useMemo(() => {
    const assignedShifts = assignedShiftsData?.shifts?.items || [];
    const shiftBufferRequests = shiftBufferRequestsData?.shiftBufferRequests?.items || [];
    const availableShifts = availableShiftsData?.availableShifts?.items || [];
    const upcomingShifts = upcomingShiftsData?.availableShifts?.items || [];

    if (currentShiftsLoading || currentShiftsError) {
      return [];
    }

    const results = [
      ...([CurrentShiftType.Assigned, CurrentShiftType.Secured].includes(type)
        ? assignedShifts
        : []),
      ...([CurrentShiftType.Assigned, CurrentShiftType.Secured].includes(type)
        ? shiftBufferRequests
        : []),
      ...([CurrentShiftType.Available].includes(type) ? availableShifts : []),
      ...([CurrentShiftType.Upcoming].includes(type) ? upcomingShifts : []),
    ];

    if (
      [CurrentShiftType.Assigned, CurrentShiftType.Secured].includes(type) &&
      orderBy === 'startTime'
    ) {
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

    return results.slice(skip, skip + limit);
  }, [
    assignedShiftsData,
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
    skip,
    limit,
  ]);

  return {
    currentShifts: shiftList,
    // Use shift list length when filters are applied since filters are local
    total: skillIds?.length || dateRange ? shiftList.length : currentShiftTotal,
    loading: currentShiftsLoading,
    error: currentShiftsError,
    refetch: refetchCurrentShifts,
  };
}
