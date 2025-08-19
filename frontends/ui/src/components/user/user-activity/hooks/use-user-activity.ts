import dayjs from "dayjs";
import { useMemo } from "react";
import { DocusignEvent, EventUserAction, EventUserActionType, Shift, ShiftInterestRequest, ShiftInterestRequestStatus, ShiftStatus } from "src/__generated__/resolvers-types";
import { useAuthContext } from "src/auth/hooks";
import { convertDate } from "src/hooks/use-datejs";
import { getShiftStatus } from "src/utils/shiftStatus";

export interface UserActivityItem {
  id: string;
  status: string;
  date: dayjs.Dayjs;
  labelColor: string;
}

export const useUserActivity = (activity: EventUserAction) => {
  const { user } = useAuthContext();
  const docusignEvents = useMemo(() => {
    const events: DocusignEvent[] = [];
    if (activity.actionType === EventUserActionType.IncidentSubmission) {
      const items = ([activity.incidentForm?.docusignEvent] as DocusignEvent[]).filter(Boolean);
      events.push(...items);
    } else {
      const res = (activity.shifts || []).reduce((acc, shift) => {
        const e = shift.docusignEvents || [];
        if (e.length > 0) {
          acc.push(...e);
        }
        return acc;
      }, [] as DocusignEvent[]);
      events.push(...res);
    }
    return events.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [activity]);

  const interestRequests = useMemo(() =>
    (activity.shiftInterestRequests || [])
    .map((request: ShiftInterestRequest): UserActivityItem => {
      let labelColor = 'default';
      switch(request.status) {
        case ShiftInterestRequestStatus.Pending:
          labelColor = 'info';
          break;
        case ShiftInterestRequestStatus.Approved:
          labelColor = 'success';
          break;
        case ShiftInterestRequestStatus.Removed:
        case ShiftInterestRequestStatus.Rejected:
          labelColor = 'error';
          break;
        default:
          labelColor = 'default';
          break;
      }

      let status = 'Pending';
      switch(request.status) {
        case ShiftInterestRequestStatus.Approved:
          status = 'Approved';
          break;
        case ShiftInterestRequestStatus.Removed:
          status = 'Removed';
          break;
        case ShiftInterestRequestStatus.Rejected:
          status = 'Rejected';
          break;
        default:
          status = 'Pending';
          break;
      }

      return {
        id: request.id,
        status,
        date: convertDate({ date: request.updatedAt, user }),
        labelColor,
      }
    })
    .sort((a, b) => {
      if (a.date.isBefore(b.date)) {
        return 1;
      }
      if (a.date.isAfter(b.date)) {
        return -1;
      }
      return 0;
    }), [
      user,
      activity.shiftInterestRequests
  ]);

  const shifts = useMemo(() =>
    (activity.shifts || [])
    .map((shift: Shift): UserActivityItem => {
    let labelColor = 'info';
    switch(shift.status) {
      case ShiftStatus.Assigned:
        labelColor = 'success';
        break;
      case ShiftStatus.Relinquished:
        labelColor = 'warning';
        break;
      case ShiftStatus.Locked:
      case ShiftStatus.Removed:
        labelColor = 'error';
        break;
      default:
        labelColor = 'info';
        break;
    }

    const status = getShiftStatus(shift);
    let date = convertDate({ date: shift.updatedAt, user })

    if (shift.status === ShiftStatus.Relinquished) {
      date = convertDate({ date: shift.createdAt, user });
    }

    return {
      id: shift.id,
      status,
      date,
      labelColor,
    }
    })
    .sort((a, b) => {
      if (a.date.isBefore(b.date)) {
        return 1;
      }
      if (a.date.isAfter(b.date)) {
        return -1;
      }
      return 0;
    }), [activity.shifts, user]);

  return {
    docusignEvents,
    interestRequests,
    shifts,
  };
};
