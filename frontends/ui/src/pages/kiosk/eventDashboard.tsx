import { Helmet } from 'react-helmet-async';
// sections
import EventDashboardView from 'src/sections/kiosk/view/event-dashboard-view';


// ----------------------------------------------------------------------

export default function EventDashboard() {
  return (
    <>
      <Helmet>
        <title> Caleo: Event Dashboard</title>
      </Helmet>

      <EventDashboardView />
    </>
  );
}
