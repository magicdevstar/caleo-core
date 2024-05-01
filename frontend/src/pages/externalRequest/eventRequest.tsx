import { Helmet } from 'react-helmet-async';
// sections
import EventRequest from 'src/sections/requests/event/event-request';

// ----------------------------------------------------------------------

export default function EventRequestView() {
  return (
    <>
      <Helmet>
        <title> Caleo: Event Request</title>
      </Helmet>

      <EventRequest />
    </>
  );
}
