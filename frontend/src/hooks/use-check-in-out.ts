import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useAuthContext } from "src/auth/hooks";
import { GET_ALL_SHIFTS } from "src/api/shifts";
import { Shift } from "src/__generated__/resolvers-types";
import { convertDate, getNow } from "./use-datejs";
import { useFeatures } from "./use-features";

export const useCheckInOut = () => {
  const { user } = useAuthContext();
  const { eventCheckIn } = useFeatures();
  const rightNow = useMemo(() => getNow({ organization: user.member.org! }), [user.member.org]);
  const minutesBeforeStartTime = user.member.org?.settings?.checkInOut?.minutesBeforeShiftStart || 15;
  const minutesAfterEndTime = user.member.org?.settings?.checkInOut?.minutesAfterShiftEnd || 60;

  const filter = useMemo(() => ({
    limit: 5,
    skip: 0,
    orderBy: 'startTime',
    order: 'asc',
    userId: user?.id,
    startTime: `${rightNow.subtract(minutesBeforeStartTime, 'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS')}Z`,
  }), [minutesBeforeStartTime, user, rightNow]);

  const { data } = useQuery(GET_ALL_SHIFTS, {
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'cache-first',
    skip: !eventCheckIn,
    variables: {
      input: filter,
    },
  });
  const shifts = useMemo(() => (data?.shifts?.items || []) as Shift[], [data]);

  const currentShifts = useMemo(() => {
    const runningShifts = shifts.filter(({
      startTime,
      endTime,
      shiftCheckInOut
    }) => {
      if (eventCheckIn) {
        if (shiftCheckInOut?.checkInTime && shiftCheckInOut.checkOutTime) {
          return false;
        }
        const now = getNow({ organization: user.member.org! });
        const formattedStart = convertDate({
          date: new Date(startTime),
          user,
        });
        const formattedEnd = convertDate({
          date: new Date(endTime),
          user,
        });
        return now.add(minutesBeforeStartTime, 'minutes').isAfter(formattedStart) && now.isBefore(formattedEnd.add(minutesAfterEndTime, 'minutes'));
      }
      return false;
    });

    return runningShifts;
  }, [shifts, user, eventCheckIn, minutesAfterEndTime, minutesBeforeStartTime]);  

  return {
    currentShifts,
  };
};
