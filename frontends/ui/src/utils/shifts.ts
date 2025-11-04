import { Shift } from "src/__generated__/resolvers-types";
import {
  setMilliseconds,
  setSeconds,
  addMinutes,
  isAfter,
} from 'date-fns';
import { IMarkerDetails } from "src/types/event-dashboard";

const truncateToMinute = (date: Date) =>
  setSeconds(setMilliseconds(date, 0), 0);

export const awaitingArrival = (shift: Shift) =>
  !!shift.userId &&
  !shift.shiftCheckInOut?.noShow &&
  !shift.shiftCheckInOut?.checkInTime;

export const checkedIn = (shift: Shift) =>
  !!shift.userId &&
  !shift.shiftCheckInOut?.noShow &&
  !!shift.shiftCheckInOut?.checkInTime &&
  !shift.shiftCheckInOut?.checkOutTime;

export const checkedOut = (shift: Shift) =>
  !!shift.userId &&
  !shift.shiftCheckInOut?.noShow &&
  !!shift.shiftCheckInOut?.checkInTime &&
  !!shift.shiftCheckInOut?.checkOutTime;

export const noShow = (shift: Shift) =>
  !!shift.userId &&
  !!shift.shiftCheckInOut?.noShow;

export const demobilized = (shift: Shift) =>
  !!shift.userId &&
  !shift.shiftCheckInOut?.noShow &&
  !!shift.shiftCheckInOut?.checkInTime &&
  !shift.shiftCheckInOut?.checkOutTime &&
  !!shift.demobilizedTime;

export const late = (shift: Shift) => {
  const baseConditions = !!shift.userId && !shift.shiftCheckInOut?.noShow;

  let userTime = truncateToMinute(new Date());
  let startTimeExtension = 1;

  if (shift.shiftCheckInOut?.checkInTime) {
    userTime = truncateToMinute(new Date(shift.shiftCheckInOut?.checkInTime));
    startTimeExtension = 15;
  }

  return baseConditions && isAfter(userTime, addMinutes(truncateToMinute(new Date(shift.startTime)), startTimeExtension));
}

export const operationsShiftStatus = (shifts: Shift[]): IMarkerDetails[] => {
  // Group shifts by assignment ID
  const groupedByAssignment = shifts.reduce((acc: Record<string, Shift[]>, shift: Shift) => {
    const assignmentId = shift.assignment?.id;
    if (!assignmentId) return acc;
    
    if (!acc[assignmentId]) {
      acc[assignmentId] = [];
    }
    acc[assignmentId].push(shift);
    return acc;
  }, {});

  return Object.values(groupedByAssignment).map((assignmentShifts: Shift[]) => {
    // Filter out no-show shifts for status evaluation
    const activeShifts = assignmentShifts.filter(shift => !noShow(shift));
    
    // Get the first shift for reference data
    const referenceShift = assignmentShifts[0];
    const { assignment } = referenceShift;
    const location = assignment?.reportingLocationDetails?.location ||
      referenceShift.event?.reportingLocation?.location;
    
    if (!location || !assignment || activeShifts.length === 0) {
      return null;
    }

    // Determine status based on rules (evaluated in order)
    let status = 'default';
    
    // Check if any shift is awaiting arrival (start time ahead and no check in)
    if (activeShifts.some(shift => awaitingArrival(shift))) {
      status = 'Awaiting arrival';
    }
    // Check if any shift is late (start time behind current time and no check in)
    else if (activeShifts.some(shift => late(shift))) {
      status = 'Late';
    }
    // Check if all shifts are checked out
    else if (activeShifts.length > 0 && activeShifts.every(shift => checkedOut(shift))) {
      status = 'Checked out';
    }
    // Check if all shifts are demobilized
    else if (activeShifts.length > 0 && activeShifts.every(shift => demobilized(shift))) {
      status = 'Demobilized';
    }
    // Check if all shifts are checked in
    else if (activeShifts.length > 0 && activeShifts.every(shift => checkedIn(shift))) {
      status = 'Checked in';
    }

    const colors = {
      'Awaiting arrival': 'orange',
      'Late': '#fa7d61ff',
      'Checked out': '#919EAB',
      'Demobilized': '#9349faff',
      'Checked in': '#21C55E',
      'default': 'default',
    }

    return {
      name: `${assignment.name} - ${new Date(referenceShift.startTime).toLocaleString()}`,
      callSign: assignment.callSign || '',
      shiftId: referenceShift.id,
      latitude: location.latitude,
      longitude: location.longitude,
      status,
      color: colors[status as keyof typeof colors],
    };
  }).filter(Boolean) as IMarkerDetails[];
};

export const getMarkers = (items: Shift[], color: string) =>
  (items || [])
  .filter((shift) => shift.event?.reportingLocation?.location || shift.assignment?.reportingLocationDetails?.location)
  .map((shift) => {
    const location = shift.event?.reportingLocation?.location || shift.assignment?.reportingLocationDetails?.location;
    return {
      name: `${color}-${shift.id}`,
      latitude: location?.latitude!,
      longitude: location?.longitude!,
      color,
      item: {id: shift.id},
    };
  });

export const getShiftStatus = (shift?: Shift) => {
  const status = {
    value: 'N/A',
    color: 'default' as 'default' | 'secondary' | 'info' | 'success' | 'warning' | 'error',
  }
  if (!shift) return status;
  if (noShow(shift)) {
    status.value = 'No Show';
    status.color = 'error';
    return status;
  }
  if (checkedOut(shift)) {
    status.value = 'Checked Out';
    status.color = 'default';
    return status;
  }
  if (demobilized(shift)) {
    status.value = 'Demobilized';
    status.color = 'secondary';
    return status;
  }
  if (checkedIn(shift)) {
    status.value = 'Checked In';
    status.color = 'success';
    return status;
  }
  if (awaitingArrival(shift)) {
    status.value = 'Awaiting Arrival';
    status.color = 'warning';
    return status;
  }
  if (late(shift)) {
    status.value = 'Late';
    status.color = 'error';
    return status;
  }
  return status;
}

export const groupShiftsByEvent = (shifts?: Shift[]) => {
  const grouped = (shifts || []).reduce((acc: Record<string, Shift[]>, shift: Shift) => {
    const eventId = shift.event?.id;
    if (!acc[eventId]) {
      acc[eventId] = [];
      }
      acc[eventId].push(shift);

      acc[eventId].sort((a, b) => {
        if (a.id < b.id) {
          return 1;
        }
        if (a.id > b.id) {
          return -1;
        }
        return 0;
      });
      return acc;
    }, {} as Record<string, Shift[]>);

  // Sort events by start date (latest first) and create a new ordered object
  const sortedEntries = Object.entries(grouped).sort(([, shiftsA], [, shiftsB]) => {
    const dateA = new Date(shiftsA[0]?.event?.startTime || 0);
    const dateB = new Date(shiftsB[0]?.event?.startTime || 0);
    return dateB.getTime() - dateA.getTime(); // Latest first
  });

  // Convert back to Record maintaining the sorted order
  return Object.fromEntries(sortedEntries);
}