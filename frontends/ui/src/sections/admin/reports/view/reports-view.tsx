import { ChangeEvent, memo, useCallback, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
// @mui
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
// hooks
import { useFeatures } from 'src/hooks/use-features';
// types
import { ReportType, ReportTypeNames, reportTypes } from 'src/types/reports';
// components
import { useSettingsContext } from 'src/components/settings';
import EventsByDate from '../reports/events-by-date';
import EventsByVenue from '../reports/events-by-venue';
import ShiftsByEvent from '../reports/shifts-by-event';
import ShiftsByOfficer from '../reports/shifts-by-officer';
import RelinquishedShiftsByOfficer from '../reports/relinquished-shifts-by-officer';
import RankedShiftsByOfficer from '../reports/ranked-shifts-by-officer';
import ShiftsByDate from '../reports/shifts-by-date';
import NoShowByOfficer from '../reports/no-show-by-officer';

dayjs.extend(utc);
dayjs.extend(timezone);

const ReportTypeSwitch = memo(({ reportType }: { reportType: ReportType }) => {
  switch (reportType) {
    case ReportType.EVENTS_BY_DATE:
      return <EventsByDate />;
    case ReportType.EVENTS_BY_VENUE:
      return <EventsByVenue />;
    case ReportType.SHIFTS_BY_EVENT:
      return <ShiftsByEvent />;
    case ReportType.SHIFTS_BY_OFFICER:
      return <ShiftsByOfficer />;
    case ReportType.SHIFTS_BY_DATE:
      return <ShiftsByDate />;
    case ReportType.RANKED_SHIFTS_BY_OFFICER:
      return <RankedShiftsByOfficer />
    case ReportType.RELINQUISHED_SHIFTS_BY_OFFICER:
      return <RelinquishedShiftsByOfficer />;
    case ReportType.NO_SHOW_REPORT_BY_OFFICER:
      return <NoShowByOfficer />;
    default:
      return null;
  }
});

export default function ReportsView() {
  const features = useFeatures();
  const settings = useSettingsContext();
  const [reportType, setReportType] = useState(ReportType.EVENTS_BY_DATE);
  const reportOptions = useMemo(() => reportTypes(features), [features]);
  console.log(reportOptions);

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
        {reportOptions.map((option) => (
          <MenuItem key={option} value={option}>
            {ReportTypeNames[option]}
          </MenuItem>
        ))}
      </TextField>
      <ReportTypeSwitch reportType={reportType} />
    </Container>
  );
}
