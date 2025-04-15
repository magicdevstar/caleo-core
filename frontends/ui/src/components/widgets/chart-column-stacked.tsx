import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
// components
import Chart, { useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = {
  title: string;
  height?: number;
  categories: string[];
  series: {
    name: string;
    data: number[];
  }[];
};

export default function ChartColumnStacked({
  title,
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
