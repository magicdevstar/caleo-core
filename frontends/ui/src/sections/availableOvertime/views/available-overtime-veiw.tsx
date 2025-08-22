import { useFeatures } from 'src/hooks/use-features';
import AvailableOvertimeByEvent from '../availableOvertime/available-overtime-by-event';
import AvailableOvertimeList from '../availableOvertime/available-overtime-list';

// ----------------------------------------------------------------------

export default function AvailableOvertimeView() {
  const { showShiftsByEvent } = useFeatures();
  
  if (showShiftsByEvent) {
    return <AvailableOvertimeByEvent />;
  }

  return <AvailableOvertimeList />;
}
