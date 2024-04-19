import { Helmet } from 'react-helmet-async';
// sections
import { OrganizationsView } from 'src/sections/organizations/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> Caleo Admin: Organizations</title>
      </Helmet>

      <OrganizationsView />
    </>
  );
}
