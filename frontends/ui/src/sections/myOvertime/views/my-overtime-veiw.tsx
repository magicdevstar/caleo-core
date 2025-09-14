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
import IncidentView from 'src/components/incidents/incident-view';
import CheckInOut from 'src/components/shifts/check-in-out';
// types
import { useTable } from 'src/components/table';
import { useAuthContext } from 'src/auth/hooks';
// local imports
import { useFeatures } from 'src/hooks/use-features';
import MyOvertimeList from '../myOvertime/my-overtime-list';

// ----------------------------------------------------------------------

const tabs = [
  {
    value: 'assigned',
    label: 'Assigned',
    visible: () => true,
  },
  {
    value: 'past',
    label: 'Past',
    visible: () => true,
  },
  {
    value: 'incident',
    label: 'Incident Submissions',
    visible: (flag: boolean) => flag,
  },
]

export default function MyOvertimeView() {
  const { user } = useAuthContext();
  const theme = useTheme();
  const { officerCheckInOut, incidentEvents } = useFeatures();
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
      <CheckInOut allowView={officerCheckInOut} fromSelfCheckout />

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
            {tabs.filter((tab) => tab.visible(incidentEvents)).map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={tab.label}
                sx={{ textTransform: 'capitalize' }}
              />
            ))}
          </Tabs>

          {
            currentTab === 'incident' && incidentEvents ? (
              <IncidentView />
            ) : (
              <MyOvertimeList
                table={table}
                setFilters={setFilters}
                filters={filters}
              />
            )
          }
        </CardContent>
      </Card>
    </Container>
  );
}
