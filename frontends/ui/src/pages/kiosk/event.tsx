import { Helmet } from 'react-helmet-async';
import EventKioskView from 'src/sections/kiosk/view/event-kiosk-view';

// ----------------------------------------------------------------------

export default function EventKiosk() {
  return (
    <>
      <Helmet>
        <title> Caleo: Event Kiosk</title>
      </Helmet>

      <EventKioskView />
    </>
  );
}
