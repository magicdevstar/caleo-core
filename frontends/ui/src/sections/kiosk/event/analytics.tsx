import { useMemo } from 'react';
import Grid from '@mui/material/Grid';
import SummaryWidget from 'src/components/widgets/summary';
import PieChart from 'src/components/widgets/pie-chart';
import ChartColumnStacked from 'src/components/widgets/chart-column-stacked';
import { IShiftData } from 'src/types/event-dashboard';

const graphColors = ['orange', '#fa7d61ff', '#21C55E', '#919EAB', '#ff2f00ff' ];

export default function Analytics({
  data
}: {
  data: IShiftData;
}) {
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
      .filter((shift) => !data.late.items.find(s => s.id === shift.id))
      .forEach((shift) => {
        // Group by assignment: use shift.assignment?.name if available, otherwise fallback to 'Unassigned'
        const assignmentName = shift.assignment?.name || 'Unassigned';
        initAssignment(assignmentName);
        groups[assignmentName].awaitingArrival += 1;
      });

    data.late.items
      .filter((shift) => !shift.shiftCheckInOut?.checkInTime)
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
      colors: graphColors,
      graph: [
        { name: 'Awaiting Arrival', data: awaitingArrivalData },
        { name: 'Late', data: lateData },
        { name: 'Checked In', data: checkedInData },
        { name: 'Checked Out', data: checkedOutData },
        { name: 'No Show', data: noShowData },
      ],
    };
  }, [data]);

  const checkInProgressPieChartData = useMemo(() => {
    const noLateAwaitingArrival = data.awaitingArrival.items
      .filter((shift) => !data.late.items.find(s => s.id === shift.id));
    const filteredLate = data.late.items
      .filter((shift) => !shift.shiftCheckInOut?.checkInTime);
    return {
      colors: graphColors,
      series: [
        { label: 'Awaiting Arrival', value: noLateAwaitingArrival.length },
        { label: 'Late', value: filteredLate.length },
        { label: 'Checked In', value: data.checkedIn.total },
        { label: 'Checked Out', value: data.checkedOut.total },
        { label: 'No Show', value: data.noShow.total },
      ],
    }
  }, [data]);

  return (
    <>
      <Grid item xs={12} md={4}>
        <SummaryWidget
          title="Awaiting Arrival"
          percent={parseFloat(((data.awaitingArrival.total / (data.assignedShifts.total || 1)) * 100).toFixed(2))}
          total={data.awaitingArrival.total}
          chart={{ series: [] }}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <SummaryWidget
          title="Total Checked In"
          percent={parseFloat(((data.checkedIn.total / (data.assignedShifts.total || 1)) * 100).toFixed(2))}
          total={data.checkedIn.total}
          chart={{ series: [] }}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <SummaryWidget
          title="Total Checked Out"
          percent={parseFloat(((data.checkedOut.total / (data.assignedShifts.total || 1)) * 100).toFixed(2))}
          total={data.checkedOut.total}
          chart={{ series: [] }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <SummaryWidget
          title="Late Personnel"
          percent={parseFloat(((data.late.total / (data.assignedShifts.total || 1)) * 100).toFixed(2))}
          total={data.late.total}
          chart={{series: []}}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <SummaryWidget
          title="No Show"
          percent={parseFloat(((data.noShow.total / (data.assignedShifts.total || 1)) * 100).toFixed(2))}
          total={data.noShow.total}
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