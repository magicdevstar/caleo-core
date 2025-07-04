import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
// components
import Chart, { useChart } from 'src/components/chart';
// utils
import { fCurrency, fNumber } from 'src/utils/format-number';

// ----------------------------------------------------------------------

type Props = {
  title: string;
  height?: number;
  categories: string[];
  currency?: boolean;
  series: {
    name: string;
    data: number[];
  }[];
};

export default function ChartColumnStacked({
  title,
  currency,
  categories,
  height = 375,
  series
}: Props) {
  const chartOptions = useChart({
    chart: {
      stacked: true,
      zoom: {
        enabled: true,
      },
    },
    legend: {
      itemMargin: {
        vertical: 8,
      },
      position: 'right',
      offsetY: 20,
    },
    plotOptions: {
      bar: {
        columnWidth: '16%',
      },
    },
    stroke: {
      show: false,
    },
    xaxis: {
      type: 'category',
      categories,
    },
    yaxis: {
      labels: {
        formatter: (value: number) => currency ? fCurrency(value) : fNumber(value),
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => currency ? fCurrency(value) : fNumber(value),
      },
    },
    dataLabels: {
      enabled: false, // You can enable this if you want data labels on the bars
      formatter: (value: number) => currency ? fCurrency(value) : fNumber(value),
    },
  });

  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <Chart dir="ltr" type="bar" series={series} options={chartOptions} height={height} />
      </CardContent>
    </Card>
  );
}
