import { ChangeEvent, memo, useCallback, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
// @mui
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
// components
import { useSettingsContext } from 'src/components/settings';
import EventsByDate from '../reports/events-by-date';
import EventsByVenue from '../reports/events-by-venue';

enum ReportType {
  EVENTS_BY_DATE = 'EVENTS_BY_DATE',
  EVENTS_BY_VENUE = 'EVENTS_BY_VENUE',
  SHIFTS_BY_EVENT = 'SHIFTS_BY_EVENT',
  SHIFTS_BY_OFFICER = 'SHIFTS_BY_OFFICER',
  SHIFTS_BY_DATE = 'SHIFTS_BY_DATE',
  RANKED_SHIFTS_BY_OFFICER = 'RANKED_SHIFTS_BY_OFFICER',
  RELINQUISHED_SHIFTS_BY_OFFICER = 'RELINQUISHED_SHIFTS_BY_OFFICER',
}

const ReportTypeNames = {
  [ReportType.EVENTS_BY_DATE]: 'Events by Date',
  [ReportType.EVENTS_BY_VENUE]: 'Events by Venue',
  [ReportType.SHIFTS_BY_EVENT]: 'Shifts by Event',
  [ReportType.SHIFTS_BY_OFFICER]: 'Shifts by Officer',
  [ReportType.SHIFTS_BY_DATE]: 'Shifts by Date',
  [ReportType.RANKED_SHIFTS_BY_OFFICER]: 'Ranked Shifts by Officer',
  [ReportType.RELINQUISHED_SHIFTS_BY_OFFICER]: 'Relinquished Shifts by Officer',
};

dayjs.extend(utc);
dayjs.extend(timezone);

const ReportTypeSwitch = memo(({ reportType }: { reportType: ReportType }) => {
  // TODO: create and add each component for creating reports
  switch (reportType) {
    case ReportType.EVENTS_BY_DATE:
      return <EventsByDate />;
    case ReportType.EVENTS_BY_VENUE:
      return <EventsByVenue />;
    case ReportType.SHIFTS_BY_EVENT:
    case ReportType.SHIFTS_BY_OFFICER:
    case ReportType.SHIFTS_BY_DATE:
    case ReportType.RANKED_SHIFTS_BY_OFFICER:
    case ReportType.RELINQUISHED_SHIFTS_BY_OFFICER:
    default:
      return null;
  }
});

export default function ReportsView() {
  const settings = useSettingsContext();
  const [reportType, setReportType] = useState(ReportType.EVENTS_BY_DATE);

  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setReportType(event?.target?.value as ReportType);
  }, []);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Reports
      </Typography>
      <TextField
        select
        fullWidth
        sx={{
          maxWidth: 250,
          mb: 5,
        }}
        label="Report Type"
        value={reportType}
        onChange={onChange}
      >
        {[...Object.values(ReportType)].map((option) => (
          <MenuItem key={option} value={option}>
            {ReportTypeNames[option]}
          </MenuItem>
        ))}
      </TextField>
      <ReportTypeSwitch reportType={reportType} />
    </Container>
  );
}
