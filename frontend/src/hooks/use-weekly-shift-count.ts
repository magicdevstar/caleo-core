import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { endOfWeek, startOfWeek } from 'date-fns';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// types
import { Shift, ShiftStatus } from 'src/__generated__/resolvers-types';
import { GET_SHIFT_DETAILS_SLIM } from 'src/api/shifts';

const dayMap: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

// Gets shifts for the week for a specific user based on a date. The logic is exactly how we do it in the back-end.
// TODO: Probably at some point we would only want to do this in the back-end.
export const useWeeklyShifts = ({
  userId,
  date,
  skip = false,
}: {
  userId?: string, // required to work, only optional to stall query
  date?: string | number | Date; // required to work, only optional to stall query
  skip?: boolean;
}) => {
  const { user } = useAuthContext();
  const queryInput = useMemo(() => {
    if (!userId || !user?.member?.org?.id || !date) {
      return null;
    }
    const weekStartsOn: any = dayMap[user?.member?.org?.weekBegins?.toLowerCase() || 'sunday'];
    const orgTimezone = user?.member?.org?.timezone || 'America/Los_Angeles';
    const shiftStartTime = utcToZonedTime(new Date(date), orgTimezone);
    const startOfShiftWeek = startOfWeek(shiftStartTime, { weekStartsOn });
    const endOfShiftWeek = endOfWeek(shiftStartTime, { weekStartsOn });

    return {
      userId,
      limit: 20,
      status: [ShiftStatus.Assigned],
      range: {
        startTime: {
          gte: zonedTimeToUtc(startOfShiftWeek, orgTimezone).toISOString(),
          lte: zonedTimeToUtc(endOfShiftWeek, orgTimezone).toISOString(),
        },
      },
    }
  }, [date, user?.member?.org, userId]);

  const { data, loading, error } = useQuery(GET_SHIFT_DETAILS_SLIM, {
    fetchPolicy: 'network-only',
    skip: Boolean(!queryInput || skip),
    variables: {
      input: queryInput || {}
    }
  });

  return {
    weeklyShifts: data?.shifts?.items as Shift[] | undefined,
    loading,
    error,
  };
};
