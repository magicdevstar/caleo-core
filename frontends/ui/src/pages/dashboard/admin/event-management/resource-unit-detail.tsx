import { Helmet } from 'react-helmet-async';
// sections
import ResourceUnitDetailView from 'src/sections/admin/event-management/views/resource-unit-detail';


// ----------------------------------------------------------------------

export default function ResourceUnit() {
  return (
    <>
      <Helmet>
        <title> Caleo: Event Dashboard</title>
      </Helmet>

      <ResourceUnitDetailView />
    </>
  );
}
