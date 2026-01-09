import { Helmet } from 'react-helmet-async';
// sections
import ResourceUnitView from 'src/sections/admin/event-management/views/resource-unit';

// ----------------------------------------------------------------------

export default function ResourceUnit() {
  return (
    <>
      <Helmet>
        <title> Caleo: Dashboards</title>
      </Helmet>

      <ResourceUnitView />
    </>
  );
}
