import { ShiftStatus } from 'src/__generated__/resolvers-types';
import { ShiftData } from 'src/api/shifts';

export const calculateNoShowPersonnelData = (data: ShiftData | undefined) => {
  if (!data?.shifts) return { percent: 0, total: 0, chart: { series: [] } };

  const noShowShifts = data.shifts.items.filter((shift) => shift.status === ShiftStatus.Assigned && shift.shiftCheckInOut?.noShow);
  const totalNoShow = noShowShifts.length;
  const totalShifts = data.shifts.total;
  const percent = totalShifts ? (totalNoShow / totalShifts) * 100 : 0;

  return { percent, total: totalNoShow, chart: { series: [] } };
};


export const calculateLatePersonalData = (data: ShiftData | undefined) => {
  if (!data?.shifts) return { percent: 0, total: 0, chart: { series: [] } };

  const now = Date.now();
  const lateShifts = data.shifts.items.filter((shift) => {
    const hasCheckedIn = !!shift.shiftCheckInOut?.checkInTime;
    const startTime = shift.startTime ? new Date(shift.startTime).getTime() : null;
    const noShow = shift.shiftCheckInOut?.noShow;
    return !hasCheckedIn && startTime !== null && (now - startTime > 60 * 1000) && !noShow;
  });

  const totalLate = lateShifts.length;
  const totalShifts = data.shifts.total;
  const percent = totalShifts ? (totalLate / totalShifts) * 100 : 0;

  // Bin the start times of the late shifts to avoid more than 10 bins
  const times = lateShifts
    .map((shift) => new Date(shift.startTime!).getTime());
  if (!times.length) {
    return { percent, total: totalLate, chart: { series: [] } };
  }

  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const range = maxTime - minTime;
  const binDuration = range > 0 ? Math.ceil(range / 10) : 5 * 60 * 1000; // default 5 mins
  const numberOfBins = Math.ceil(range / binDuration) + 1;
  const bins = new Array(numberOfBins).fill(0);
  times.forEach((time) => {
    const binIndex = Math.floor((time - minTime) / binDuration);
    bins[binIndex] += 1;
  });

  return { percent, total: totalLate, chart: { series: bins } };
};

export const calculateCheckData = ({
  data,
  timeKey,
} : {
  data: ShiftData | undefined,
  timeKey: 'checkInTime' | 'checkOutTime'
}) => {
  if (!data?.shifts) return { percent: 0, total: 0, chart: { series: [] } };

  // Filter shifts that have the specified check time
  const filteredShifts = data.shifts.items.filter((shift) => shift.shiftCheckInOut?.[timeKey] && !shift.shiftCheckInOut?.noShow);
  const totalFiltered = filteredShifts.length;
  const totalShifts = data.shifts.total;
  const percent = totalShifts ? (totalFiltered / totalShifts) * 100 : 0;

  // Bin the check times dynamically to ensure no more than 10 bins
  const times = filteredShifts
    .map((shift) => new Date(shift.shiftCheckInOut?.[timeKey]!).getTime());
  if (!times.length) {
    return { percent, total: totalFiltered, chart: { series: [] } };
  }
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const range = maxTime - minTime;
  const binDuration = range > 0 ? Math.ceil(range / 10) : 5 * 60 * 1000; // Default to 5 minutes if range is 0
  const numberOfBins = Math.ceil(range / binDuration) + 1;
  const bins = new Array(numberOfBins).fill(0);
  times.forEach((time) => {
    const binIndex = Math.floor((time - minTime) / binDuration);
    bins[binIndex] += 1;
  });
  return { percent, total: totalFiltered, chart: { series: bins } };
};