import { Helmet } from 'react-helmet-async';
// sections
import DashboardView from 'src/sections/dashboard/views/dashboard-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> Caleo: Dashboard</title>
      </Helmet>

      <DashboardView />
    </>
  );
}
