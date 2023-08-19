import { Helmet } from 'react-helmet-async';
// sections
import { EditAssignmentView } from 'src/sections/admin/overtimeManagement/views';

// ----------------------------------------------------------------------

export default function EditVenue() {
  return (
    <>
      <Helmet>
        <title> Caleo: Edit Event Assignment</title>
      </Helmet>

      <EditAssignmentView />
    </>
  );
}
