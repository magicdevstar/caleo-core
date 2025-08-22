import { useCallback, useState } from 'react';
// @mui
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
// components
import { useSettingsContext } from 'src/components/settings';
// types
import { useTable } from 'src/components/table';
import { useAuthContext } from 'src/auth/hooks';
// local imports
import CheckInOut from 'src/components/shifts/check-in-out';
import { useFeatures } from 'src/hooks/use-features';
import MyOvertimeList from '../myOvertime/my-overtime-list';
import MyOvertimeGroupedByEvent from '../myOvertime/my-overtime-grouped-by-event';

// ----------------------------------------------------------------------

export default function MyOvertimeView() {
  const { user } = useAuthContext();
  const theme = useTheme();
  const { officerCheckInOut, showShiftsByEvent } = useFeatures();
  const [currentTab, setCurrentTab] = useState('assigned');
  const table = useTable({
    defaultOrderBy: 'startTime',
    defaultOrder: 'asc',
    defaultRowsPerPage: 10000,
  });
  const [filters, setFilters] = useState<any>({
    limit: table.rowsPerPage,
    skip: table.page * table.rowsPerPage,
    orderBy: table.orderBy,
    order: table.order,
    userId: user?.id,
    startTime: new Date().toISOString(),
  });
  const settings = useSettingsContext();

  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      setCurrentTab(newValue);
      if (newValue === 'assigned') {
        setFilters((c: any) => {
          delete c.endTime;
          c.startTime = new Date().toISOString();
          return c;
        });
      } else if (newValue === 'past') {
        setFilters((c: any) => {
          c.endTime = new Date().toISOString();
          delete c.startTime;
          return c;
        });
      } else {
        setFilters((c: any) => {
          delete c.endTime;
          delete c.startTime;
          return c;
        });
      }
    },
    [setFilters]
  );

  return (
    <Container sx={{
      height: '100%',
    }} maxWidth={settings.themeStretch ? false : 'lg'}>
      <CheckInOut allowView={officerCheckInOut} />

      <Box>
        <Typography variant="h4" gutterBottom>
          My Overtime
        </Typography>
      </Box>

      <Card sx={{ background: alpha(theme.palette.background.paper, 0.5) }}>
        <CardContent>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            sx={{mb: { xs: 3, md: 5 }}}
          >
            {['assigned', 'past'].map((tab) => (
              <Tab
                key={tab}
                iconPosition="end"
                value={tab}
                label={tab}
                sx={{ textTransform: 'capitalize' }}
              />
            ))}
          </Tabs>

          {showShiftsByEvent ? (
            <MyOvertimeGroupedByEvent
              table={table}
              setFilters={setFilters}
              filters={filters}
            />
          ) : (
            <MyOvertimeList
              table={table}
              setFilters={setFilters}
              filters={filters}
            />
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
