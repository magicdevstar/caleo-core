import { Helmet } from 'react-helmet-async';
// sections
import { EventsView } from 'src/sections/admin/overtimeManagement/views';

// ----------------------------------------------------------------------

export default function EventsPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Events</title>
      </Helmet>

      <EventsView />
    </>
  );
}
