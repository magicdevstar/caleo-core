import { Helmet } from 'react-helmet-async';
// sections
import DashboardsView from 'src/sections/admin/overtimeManagement/views/dashboards-view';

// ----------------------------------------------------------------------

export default function EventDashboards() {
  return (
    <>
      <Helmet>
        <title> Caleo: Dashboards</title>
      </Helmet>

      <DashboardsView />
    </>
  );
}
