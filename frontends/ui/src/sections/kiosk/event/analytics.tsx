import { useMemo } from 'react';
import Grid from '@mui/material/Grid';
import SummaryWidget from 'src/components/widgets/summary';
import { ShiftStatus } from 'src/__generated__/resolvers-types';
import PieChart from 'src/components/widgets/pie-chart';
import ChartColumnStacked from 'src/components/widgets/chart-column-stacked';
import { ShiftData } from 'src/api/shifts';
import { calculateCheckData, calculateLatePersonalData, calculateNoShowPersonnelData } from './analytics/utils';

export default function Analytics({
  data
}: {
  data: ShiftData | undefined;
}) {
  const filteredData = useMemo(() => (data?.shifts?.items || []).filter((shift) => shift.status === ShiftStatus.Assigned), [data]);
  const total = filteredData.length;

  const checkInData = useMemo(() => calculateCheckData({
    data: filteredData,
    total,
    timeKey: 'checkInTime'
  }), [filteredData, total]);
  const checkOutData = useMemo(() => calculateCheckData({
    data: filteredData,
    total,
    timeKey: 'checkOutTime'
  }), [filteredData, total]);

  const latePersonnelData = useMemo(() => calculateLatePersonalData(filteredData, total), [filteredData, total]);

  const noShowPersonnelData = useMemo(() => calculateNoShowPersonnelData(filteredData, total), [filteredData, total]);

  const awaitingArrivalShifts = useMemo(() => {
    if (filteredData.length === 0) return { percent: 0, total: 0, chart: { series: [] } };
    const awaitingArrival = filteredData.filter((shift) => !shift.shiftCheckInOut?.checkInTime);
    const totalAwaiting = awaitingArrival.length;
    const totalShifts = total;
    const percent = totalShifts ? (totalAwaiting / totalShifts) * 100 : 0;
    return { percent, total: totalAwaiting, chart: { series: [] } };
  }, [filteredData, total]);

  const assignmentShiftData = useMemo(() => {
    if (filteredData.length === 0) {
      return { names: [], graph: [{ name: 'Checked In', data: [] }, { name: 'Not Checked In', data: [] }] };
    }

    const groups: { [key: string]: { checkedIn: number; notCheckedIn: number } } = {};

    filteredData
      .forEach((shift) => {
      if (shift?.shiftCheckInOut?.noShow) {
        return; // Skip shifts that are marked as no-show
      }
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
  }, [filteredData]);

  const checkInProgressPieChartData = useMemo(() => {
    if (filteredData.length === 0) {
      return { series: [] };
    }
    let checkedIn = 0;
    let notCheckedIn = 0;
    filteredData
    .forEach((shift) => {
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
  }, [filteredData]);

  console.log(checkInData);

  return (
    <>
      <Grid item xs={12} md={4}>
        <SummaryWidget
          title="Awaiting Arrival"
          percent={awaitingArrivalShifts.percent}
          total={awaitingArrivalShifts.total}
          chart={awaitingArrivalShifts.chart}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <SummaryWidget
          title="Total Check Ins"
          percent={checkInData.percent} // Updated code
          total={checkInData.total} // Updated code
          chart={{ series: [] }} // Updated code
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <SummaryWidget
          title="Total Check Outs"
          percent={checkOutData.percent}
          total={checkOutData.total}
          chart={{ series: [] }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <SummaryWidget
          title="Late Personnel"
          percent={latePersonnelData.percent}
          total={latePersonnelData.total}
          chart={{series: []}}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <SummaryWidget
          title="No Show"
          percent={noShowPersonnelData.percent}
          total={noShowPersonnelData.total}
          chart={{series: []}}
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