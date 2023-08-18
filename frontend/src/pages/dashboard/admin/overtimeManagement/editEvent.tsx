import { Helmet } from 'react-helmet-async';
// sections
import { EditEventView } from 'src/sections/admin/overtimeManagement/views';

// ----------------------------------------------------------------------

export default function EditVenue() {
  return (
    <>
      <Helmet>
        <title> Caleo: Edit Event</title>
      </Helmet>

      <EditEventView />
    </>
  );
}
