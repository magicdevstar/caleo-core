import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useAuthContext } from "src/auth/hooks";
import { GET_ALL_SHIFTS } from "src/api/shifts";
import { MemberRole, Shift } from "src/__generated__/resolvers-types";
import { convertDate, getNow } from "./use-datejs";
import { useFeatures } from "./use-features";

export const useCheckInOut = ({
  userId,
  eventId,
} : {
  eventId?: string;
  userId?: string;
} = {}) => {
  const { user } = useAuthContext();
  const { eventCheckIn, eventCheckOut } = useFeatures();
  const rightNow = useMemo(() => getNow({ organization: user.member.org! }), [user.member.org]);
  const minutesBeforeStartTime = user.member.org?.settings?.checkInOut?.minutesBeforeShiftStart || 15;
  const minutesAfterEndTime = user.member.org?.settings?.checkInOut?.minutesAfterShiftEnd || 60;

  const filter = useMemo(() => {
    const uId = userId && user.member.role === MemberRole.Admin ? userId : user?.id;
    return {
      limit: 5,
      skip: 0,
      orderBy: 'startTime',
      order: 'asc',
      userId: uId,
      startTime: `${rightNow.subtract(minutesBeforeStartTime, 'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS')}Z`,
      ...(eventId ? { eventIds: [eventId] } : {}),
    }
  }, [
    eventId,
    userId,
    minutesBeforeStartTime,
    user,
    rightNow
  ]);

  const { data, loading } = useQuery(GET_ALL_SHIFTS, {
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'cache-first',
    skip: !eventCheckIn && !eventCheckOut,
    variables: {
      input: filter,
    },
  });
  const shifts = useMemo(() => (data?.shifts?.items || []) as Shift[], [data]);

  const currentShifts = useMemo(() => {
    const runningShifts = shifts.filter(({
      startTime,
      endTime,
      shiftCheckInOut,
      event,
      assignment,
    }) => {
      if (
        (user.member.allowSelfCheckIn) &&
        (eventCheckIn || eventCheckOut) &&
        (event?.allowOfficerCheckIn || assignment?.allowOfficerCheckIn)
      ) {
        // Check if the user has completed check-in/out or not
        let complete = true;
        if (eventCheckIn && !shiftCheckInOut?.checkInTime) {
          complete = false;
        }
        if (eventCheckOut && !shiftCheckInOut?.checkOutTime) {
          complete = false;
        }
        if (complete) {
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
  }, [shifts, user, eventCheckIn, eventCheckOut, minutesAfterEndTime, minutesBeforeStartTime]);  

  return {
    loading,
    currentShifts,
  };
};
