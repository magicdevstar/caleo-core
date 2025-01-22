import { useCallback, useMemo } from 'react';
import { useQuery } from '@apollo/client';
// @mui
import { alpha, useTheme } from '@mui/material/styles';
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
//
import AnalyticsWidgetSummary from "src/components/analytics/analytics-widget-summary";
import Iconify from "src/components/iconify";
import { GET_LOTTERY_ANALYTICS } from 'src/api/analytics';
import { LottoRequests, ShiftLotteryRequestStatus } from 'src/__generated__/resolvers-types';
import { useDownloadCsv } from 'src/hooks/use-download-csv';

export default function LotteryAnalytics({
  name,
  userId,
}: {
  name?: string;
  userId?: string;
}) {
  const theme = useTheme();
  const { download } = useDownloadCsv({
    fileName: `${name?.replaceAll(' ', '_')}-lottery-review`,
    ext: 'csv',
  });
  const { data, loading } = useQuery(GET_LOTTERY_ANALYTICS, {
    variables: {
      userId,
    },
  });

  const hasData = useMemo(() => data?.lottoAnalytics || loading, [data?.lottoAnalytics, loading]);
  const sortedRequests = useMemo(() => {
    if (data?.lottoAnalytics?.requests) {
      return [...data.lottoAnalytics.requests]?.sort((a: any, b: any) => {
        if (a.status === ShiftLotteryRequestStatus.Approved) return -1;
        if (b.status === ShiftLotteryRequestStatus.Approved) return 1;
        return 0;
      });
    }
    return [];
  }, [data?.lottoAnalytics?.requests]);

  const downloadData = useCallback(() => {
    const formattedJson = sortedRequests.map((request: LottoRequests) => ({
      'Event Name': request.event?.name || '',
      'Assignment Name': request.assignment?.name || '',
      'Request Status': request.status,
      'Total Rankings': request.totalRequests,
    }));
    download(formattedJson);
  }, [download, sortedRequests]);

  let summary = <Box height={24} />
  if (loading) {
    summary = <Skeleton variant="rounded" width="100%" height={44} />
  } else if (data?.lottoAnalytics) {
    summary = (
      <Card>
        <Accordion>
          <AccordionSummary
            expandIcon={<Iconify icon="solar:alt-arrow-down-bold" />}
            aria-controls="lottery-review"
            id="lottery-review-header"
          >
            Full summary {data?.lottoAnalytics?.approved === 0 && '- Try ranking more shifts to improve your odds'}
          </AccordionSummary>
          <AccordionDetails>
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {sortedRequests.map((request: any) => (
                <ListItem key={request.id}>
                  <ListItemText primary={`${request.event.name} - ${request.assignment.name}`} secondary={(
                    <>
                      <Typography variant='caption'>Status: {request.status === ShiftLotteryRequestStatus.Approved ? <strong>{request.status}</strong> : request.status}</Typography><br/>
                      <Typography variant='caption'>Total Rankings: {request.totalRequests}</Typography>
                    </>
                  )} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      </Card>
    )
  }

  const analytics = (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <AnalyticsWidgetSummary
          loading={loading}
          title="Shifts in Lottery"
          total={data?.lottoAnalytics?.totalShifts || 0}
          icon={<Iconify icon="solar:clipboard-list-bold-duotone" width="100%" />}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <AnalyticsWidgetSummary
          loading={loading}
          title="Shifts Ranked"
          total={data?.lottoAnalytics?.total || 0}
          color="info"
          icon={<Iconify icon="solar:ranking-bold-duotone" width="100%" />}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <AnalyticsWidgetSummary
          loading={loading}
          title="Shifts Won"
          total={data?.lottoAnalytics?.approved || 0}
          color="warning"
          icon={<Iconify icon="solar:verified-check-bold-duotone" width="100%" />}
        />
      </Grid>

      <Grid item xs={12}>
        {summary}
      </Grid>
    </Grid>
  );

  return (
    <Card sx={{ textAlign: 'left', mb: 2, background: alpha(theme.palette.background.paper, 0.5) }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" color="text.secondary">
            Previous lottery breakdown {!hasData && '- nothing to review'}
          </Typography>
          {
            hasData && (
              <Button
                onClick={downloadData}
                component="label"
                variant="contained"
                tabIndex={-1}
                startIcon={<Iconify icon="solar:download-square-bold-duotone" />}
              >Download</Button>
            )
          }
        </Box>
        {!hasData && <Typography variant="body2" color="text.secondary">Be sure to rank shifts in the next lottery!</Typography>}
        {hasData && analytics}
      </CardContent>
    </Card>
  )
}
