import { Helmet } from 'react-helmet-async';
// sections
import { OrganizationListView } from 'src/sections/organization/view';

// ----------------------------------------------------------------------

export default function OrganizationsListPage() {
  return (
    <>
      <Helmet>
        <title> Caleo Admin: Organizations</title>
      </Helmet>

      <OrganizationListView />
    </>
  );
}
