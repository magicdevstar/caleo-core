import { Helmet } from 'react-helmet-async';
// sections
import OperationsUnitDetail from 'src/sections/admin/event-management/views/operations-unit-detail';

// ----------------------------------------------------------------------

export default function EventOperations() {
  return (
    <>
      <Helmet>
        <title> Caleo: Event Operations</title>
      </Helmet>

      <OperationsUnitDetail />
    </>
  );
}
