import { useFeatures } from 'src/hooks/use-features';
import UpcomingOvertimeByEvent from '../upcomingOvertime/upcomingOvertimeByEvent';
import UpcomingOvertimeList from '../upcomingOvertime/upcomingOvertimeList';

// ----------------------------------------------------------------------

export default function UpcomingOvertimeView() {
  const { showShiftsByEvent } = useFeatures();
  if (showShiftsByEvent) {
    return <UpcomingOvertimeByEvent />;
  }

  return <UpcomingOvertimeList />;
}
