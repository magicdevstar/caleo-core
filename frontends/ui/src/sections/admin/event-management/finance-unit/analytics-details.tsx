import Grid from "@mui/material/Grid";
import { FinanceShift } from "src/__generated__/resolvers-types";
import AppWidget from "src/components/widgets/app-widget";
import ChartColumnStacked from "src/components/widgets/chart-column-stacked";
import LargeSummary from "src/components/widgets/large-summary";
import LineChart from "src/components/widgets/line-chart";
import PieChart from "src/components/widgets/pie-chart";
import PieChartFull from "src/components/widgets/pie-chart-full";
import SummaryWidget from "src/components/widgets/summary";
import { useFinanceCalculations } from "src/hooks/use-finance-calculations";
import { useShiftsByDate } from "src/hooks/use-shifts-by-date";

interface Props {
  data: FinanceShift[];
};

export default function AnalyticsDetails({ data }: Props) {
  const financeData = useFinanceCalculations(data);
  const shiftsByDate = useShiftsByDate(data);

  return (
    <>
      <Grid item xs={12} md={4}>
        <SummaryWidget
          title="Total Cost"
          currency
          percent={financeData.totalCost.percent}
          total={financeData.totalCost.total}
          chart={financeData.totalCost.chart}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <AppWidget
          sx={{ height: '100%' }}
          title="Personnel Cost"
          currency
          total={financeData.personnelCost.total}
          icon={financeData.personnelCost.icon}
          chart={financeData.personnelCost.chart}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <AppWidget
          sx={{ height: '100%' }}
          title="Equipment Cost"
          currency
          color={financeData.equipmentCost.color as any}
          total={financeData.equipmentCost.total}
          icon={financeData.equipmentCost.icon}
          chart={financeData.equipmentCost.chart}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <PieChart
          currency
          title="Cost by Time Type"
          chart={financeData.costByTimeType}
        />
      </Grid>
      <Grid item xs={12} md={8}>
        <ChartColumnStacked
          currency
          categories={financeData.costsByRank.categories}
          title="Cost by Rank"
          series={financeData.costsByRank.series}
        />
      </Grid>

      <Grid item xs={12} md={8}>
        <LineChart
          title="Shifts by Date"
          chart={shiftsByDate}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <LargeSummary
          sx={{
            height: '100%',
            justifyContent: 'space-around',
          }}
          title="Total Shifts"
          total={financeData.totalShifts.total}
          percent={financeData.totalShifts.percent}
          chart={financeData.totalShifts.chart as any}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <PieChartFull
          title="Shift by Rank"
          chart={financeData.shiftsByRank}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <PieChartFull
          title="Shift by Division"
          chart={financeData.shiftsByDivision}
        />
      </Grid>
    </>
  )
}