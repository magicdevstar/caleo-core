import { Helmet } from 'react-helmet-async';
// sections
import { EditShiftView } from 'src/sections/admin/overtimeManagement/views';

// ----------------------------------------------------------------------

export default function EditVenue() {
  return (
    <>
      <Helmet>
        <title> Caleo: Edit Event Assignment Shift</title>
      </Helmet>

      <EditShiftView />
    </>
  );
}
