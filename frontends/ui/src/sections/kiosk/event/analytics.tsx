import { useMemo } from 'react';
import Grid from '@mui/material/Grid';
import SummaryWidget from 'src/components/widgets/summary';
import { ShiftStatus } from 'src/__generated__/resolvers-types';
import PieChart from 'src/components/widgets/pie-chart';
import ChartColumnStacked from 'src/components/widgets/chart-column-stacked';
import { ShiftData } from 'src/api/shifts';

const calculateCheckData = ({
  data,
  timeKey,
} : {
  data: ShiftData | undefined,
  timeKey: 'checkInTime' | 'checkOutTime'
}) => {
  if (!data?.shifts) return { percent: 0, total: 0, chart: { series: [] } };

  // Filter shifts that have the specified check time
  const filteredShifts = data.shifts.items.filter((shift) => shift.shiftCheckInOut?.[timeKey]);
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

export default function Analytics({
  data
}: {
  data: ShiftData | undefined;
}) {
  const checkInData = useMemo(() => calculateCheckData({
    data,
    timeKey: 'checkInTime'
  }), [data]);
  const checkOutData = useMemo(() => calculateCheckData({
    data,
    timeKey: 'checkOutTime'
  }), [data]);

  const awaitingArrivalShifts = useMemo(() => {
    if (!data?.shifts) return { percent: 0, total: 0, chart: { series: [] } };
    const awaitingArrival = data.shifts.items.filter((shift) => shift.status === ShiftStatus.Assigned && !shift.shiftCheckInOut?.checkInTime);
    const totalAwaiting = awaitingArrival.length;
    const totalShifts = data.shifts.total;
    const percent = totalShifts ? (totalAwaiting / totalShifts) * 100 : 0;
    return { percent, total: totalAwaiting, chart: { series: [] } };
  }, [data]);

  const assignmentShiftData = useMemo(() => {
    if (!data?.shifts) {
      return { names: [], graph: [{ name: 'Checked In', data: [] }, { name: 'Not Checked In', data: [] }] };
    }

    const groups: { [key: string]: { checkedIn: number; notCheckedIn: number } } = {};

    data.shifts.items.forEach((shift) => {
      // Group by assignment: use shift.assignment?.name if available, otherwise fallback to 'Unassigned'
      const assignmentName = shift.assignment?.name || 'Unassigned';
      if (!groups[assignmentName]) {
        groups[assignmentName] = { checkedIn: 0, notCheckedIn: 0 };
      }
      // Check if the shift has been checked in based on checkInTime
      if (shift.shiftCheckInOut?.checkInTime) {
        groups[assignmentName].checkedIn += 1;
      } else {
        groups[assignmentName].notCheckedIn += 1;
      }
    });

    const names = Object.keys(groups);
    const checkedInData = names.map((name) => groups[name].checkedIn);
    const notCheckedInData = names.map((name) => groups[name].notCheckedIn);

    return {
      names,
      graph: [
        { name: 'Checked In', data: checkedInData },
        { name: 'Not Checked In', data: notCheckedInData }
      ]
    };
  }, [data]);

  const checkInProgressPieChartData = useMemo(() => {
    if (!data?.shifts) {
      return { series: [] };
    }
    let checkedIn = 0;
    let notCheckedIn = 0;
    data.shifts.items.forEach((shift) => {
      if (shift.shiftCheckInOut?.checkInTime) {
        checkedIn += 1;
      } else {
        notCheckedIn += 1;
      }
    });
    return {
      series: [
        { label: 'Checked In', value: checkedIn },
        { label: 'Not Checked In', value: notCheckedIn }
      ]
    };
  }, [data]);

  return (
    <>
      <Grid item xs={12} md={4}>
        {/* Unassigned Shifts */}
        <SummaryWidget
          title="Awaiting Arrival"
          percent={awaitingArrivalShifts.percent}
          total={awaitingArrivalShifts.total}
          chart={awaitingArrivalShifts.chart}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        {/* Total check ins */}
        <SummaryWidget
          title="Total Check Ins"
          percent={checkInData.percent} // Updated code
          total={checkInData.total} // Updated code
          chart={checkInData.chart} // Updated code
        />
      </Grid>

      <Grid item xs={12} md={4}>
        {/* Total Check outs */}
        <SummaryWidget
          title="Total Check Outs"
          percent={checkOutData.percent}
          total={checkOutData.total}
          chart={checkOutData.chart}
        />
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <PieChart
          title="Check In Progress"
          chart={checkInProgressPieChartData}
        />
      </Grid>

      <Grid item xs={12} md={6} lg={8}>
        <ChartColumnStacked
          categories={assignmentShiftData.names}
          title="Check In by Assignment"
          series={assignmentShiftData.graph}
        />
      </Grid>
    </>
  );
}