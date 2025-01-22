import { Helmet } from 'react-helmet-async';
// sections
import AvailableOvertimeView from 'src/sections/availableOvertime/views/available-overtime-veiw';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> Caleo: Available Overtime</title>
      </Helmet>

      <AvailableOvertimeView />
    </>
  );
}
