import { Helmet } from 'react-helmet-async';
import EventUserKioskView from 'src/sections/kiosk/view/event-user-kiosk-view';

// ----------------------------------------------------------------------

export default function EventUserKiosk() {
  return (
    <>
      <Helmet>
        <title> Caleo: Event Kiosk</title>
      </Helmet>

      <EventUserKioskView />
    </>
  );
}
