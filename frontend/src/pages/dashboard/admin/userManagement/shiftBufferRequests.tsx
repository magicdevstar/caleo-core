import { Helmet } from 'react-helmet-async';
// sections
import { ShiftBufferRequestsView } from 'src/sections/admin/userManagement/view';

// ----------------------------------------------------------------------

export default function ShiftBufferRequestsPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Shift Buffer Requests</title>
      </Helmet>

      <ShiftBufferRequestsView />
    </>
  );
}
