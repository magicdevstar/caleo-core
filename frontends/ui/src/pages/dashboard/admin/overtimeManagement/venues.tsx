import { Helmet } from 'react-helmet-async';
// sections
import { VenuesView } from 'src/sections/admin/overtimeManagement/views';

// ----------------------------------------------------------------------

export default function VenuesPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Venues</title>
      </Helmet>

      <VenuesView />
    </>
  );
}
