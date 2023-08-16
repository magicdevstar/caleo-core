import { Helmet } from 'react-helmet-async';
// sections
import { EditVenueView } from 'src/sections/admin/overtimeManagement/views';

// ----------------------------------------------------------------------

export default function EditVenue() {
  return (
    <>
      <Helmet>
        <title> Caleo: Edit Venue</title>
      </Helmet>

      <EditVenueView />
    </>
  );
}
