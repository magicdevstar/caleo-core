import { useMemo } from 'react';
import Grid from '@mui/material/Grid';
import SummaryWidget from 'src/components/widgets/summary';
import PieChart from 'src/components/widgets/pie-chart';
import ChartColumnStacked from 'src/components/widgets/chart-column-stacked';
import { IShiftData } from 'src/types/event-dashboard';
import { calculateCheckData, calculateLatePersonalData, calculateNoShowPersonnelData } from './analytics/utils';

export default function Analytics({
  data
}: {
  data: IShiftData;
}) {
  const checkInData = useMemo(() => calculateCheckData({
    data: data.checkedIn.items,
    total: data.checkedIn.total,
    timeKey: 'checkInTime'
  }), [data.checkedIn]);
  const checkOutData = useMemo(() => calculateCheckData({
    data: data.checkedOut.items,
    total: data.checkedOut.total,
    timeKey: 'checkOutTime'
  }), [data.checkedOut]);

  const latePersonnelData = useMemo(() => calculateLatePersonalData(data.late.items, data.late.total), [data.late]);

  const noShowPersonnelData = useMemo(() => calculateNoShowPersonnelData(data.noShow.items, data.noShow.total), [data.noShow]);

  const awaitingArrivalShifts = useMemo(() => {
    if (data.awaitingArrival.total === 0) return { percent: 0, total: 0, chart: { series: [] } };
    const awaitingArrival = data.awaitingArrival.items;
    const totalAwaiting = awaitingArrival.length;
    const totalShifts = data.assignedShifts.total;
    const percent = totalShifts ? (totalAwaiting / totalShifts) * 100 : 0;
    return { percent, total: totalAwaiting, chart: { series: [] } };
  }, [data]);

  const assignmentShiftData = useMemo(() => {
    if (data.assignedShifts.total === 0) {
      return {
        names: [],
        graph: [
          { name: 'Awaiting Arrival', data: [] },
          { name: 'Late', data: [] },
          { name: 'Checked In', data: [] },
          { name: 'Checked Out', data: [] },
          { name: 'No Show', data: [] },
        ]
      };
    }

    const groups: {
      [key: string]: {
        awaitingArrival: number;
        late: number;
        checkedIn: number;
        checkedOut: number;
        noShow: number;
      }
    } = {};

    const initAssignment = (name: string) => {
      if (!groups[name]) {
        groups[name] = {
          awaitingArrival: 0,
          late: 0,
          checkedIn: 0,
          checkedOut: 0,
          noShow: 0
        };
      }
    }

    data.awaitingArrival.items
      .forEach((shift) => {
        // Group by assignment: use shift.assignment?.name if available, otherwise fallback to 'Unassigned'
        const assignmentName = shift.assignment?.name || 'Unassigned';
        initAssignment(assignmentName);
        groups[assignmentName].awaitingArrival += 1;
      });

    data.late.items
      .forEach((shift) => {
        // Group by assignment: use shift.assignment?.name if available, otherwise fallback to 'Unassigned'
        const assignmentName = shift.assignment?.name || 'Unassigned';
        initAssignment(assignmentName);
        groups[assignmentName].late += 1;
      });

    data.checkedIn.items
      .forEach((shift) => {
        // Group by assignment: use shift.assignment?.name if available, otherwise fallback to 'Unassigned'
        const assignmentName = shift.assignment?.name || 'Unassigned';
        initAssignment(assignmentName);
        groups[assignmentName].checkedIn += 1;
      });

    data.checkedOut.items
      .forEach((shift) => {
        // Group by assignment: use shift.assignment?.name if available, otherwise fallback to 'Unassigned'
        const assignmentName = shift.assignment?.name || 'Unassigned';
        initAssignment(assignmentName);
        groups[assignmentName].checkedOut += 1;
      });

    data.noShow.items
      .forEach((shift) => {
        // Group by assignment: use shift.assignment?.name if available, otherwise fallback to 'Unassigned'
        const assignmentName = shift.assignment?.name || 'Unassigned';
        initAssignment(assignmentName);
        groups[assignmentName].noShow += 1;
      });

    const names = Object.keys(groups);
    const lateData = names.map((name) => groups[name].late);
    const awaitingArrivalData = names.map((name) => groups[name].awaitingArrival);
    const noShowData = names.map((name) => groups[name].noShow);
    const checkedInData = names.map((name) => groups[name].checkedIn);
    const checkedOutData = names.map((name) => groups[name].checkedOut);

    return {
      names,
      colors: ['#2065D1', 'orange', '#919EAB', '#21C55E', '#FF5730'],
      graph: [
        { name: 'Awaiting Arrival', data: awaitingArrivalData },
        { name: 'Late', data: lateData },
        { name: 'Checked In', data: checkedInData },
        { name: 'Checked Out', data: checkedOutData },
        { name: 'No Show', data: noShowData },
      ],
    };
  }, [data]);

  const checkInProgressPieChartData = useMemo(() => ({
    colors: ['#2065D1', 'orange', '#919EAB', '#21C55E', '#FF5730'],
    series: [
      { label: 'Awaiting Arrival', value: data.awaitingArrival.total },
      { label: 'Late', value: data.late.total },
      { label: 'Checked In', value: data.checkedIn.total },
      { label: 'Checked Out', value: data.checkedOut.total },
      { label: 'No Show', value: data.noShow.total },
    ],
  }), [data]);

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
          title="Personnel Status"
          chart={checkInProgressPieChartData}
        />
      </Grid>

      <Grid item xs={12} md={6} lg={8}>
        <ChartColumnStacked
          colors={assignmentShiftData.colors}
          categories={assignmentShiftData.names}
          title="Status by Assignment"
          series={assignmentShiftData.graph}
        />
      </Grid>
    </>
  );
}