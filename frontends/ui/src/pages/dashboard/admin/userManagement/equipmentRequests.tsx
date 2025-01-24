import { Helmet } from 'react-helmet-async';
// sections
import { EquipmentRequestsView } from 'src/sections/admin/userManagement/view';

// ----------------------------------------------------------------------

export default function EquipmentRequestsPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Equipment Requests</title>
      </Helmet>

      <EquipmentRequestsView />
    </>
  );
}
