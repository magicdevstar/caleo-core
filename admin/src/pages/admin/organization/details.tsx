import { Helmet } from 'react-helmet-async';
// sections
import { OrganizationDetailsView } from 'src/sections/organization/view';

// ----------------------------------------------------------------------

export default function OrganizationsListPage() {
  return (
    <>
      <Helmet>
        <title> Caleo Admin: Organization Details</title>
      </Helmet>

      <OrganizationDetailsView />
    </>
  );
}
