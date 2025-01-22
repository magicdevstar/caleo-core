import { Helmet } from 'react-helmet-async';
// sections
import UpcomingOvertimeView from 'src/sections/upcomingOvertime/views/upcoming-overtime-veiw';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> Caleo: Upcoming Overtime</title>
      </Helmet>

      <UpcomingOvertimeView />
    </>
  );
}
