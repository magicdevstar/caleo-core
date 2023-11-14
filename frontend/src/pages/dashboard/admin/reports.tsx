import { Helmet } from 'react-helmet-async';
// sections
import ReportsView from 'src/sections/admin/reports/view/reports-view';

// ----------------------------------------------------------------------

export default function AdminReports() {
  return (
    <>
      <Helmet>
        <title> Caleo: Reports</title>
      </Helmet>

      <ReportsView />
    </>
  );
}
