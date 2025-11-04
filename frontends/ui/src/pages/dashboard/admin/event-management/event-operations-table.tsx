import { Helmet } from 'react-helmet-async';
import { paths } from 'src/routes/paths';
// sections
import TableView from 'src/sections/admin/event-management/views/event-table';

// ----------------------------------------------------------------------

export default function OperationsEventTable() {
  return (
    <>
      <Helmet>
        <title> Caleo: Operations Event Select</title>
      </Helmet>

      <TableView title="Operations Unit" pathLink={paths.dashboard.admin.eventManagement.operations} />
    </>
  );
}
