import { Helmet } from 'react-helmet-async';
// sections
import { AccountRequestsView } from 'src/sections/admin/userManagement/view';

// ----------------------------------------------------------------------

export default function AccountRequestsPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Account Requests</title>
      </Helmet>

      <AccountRequestsView />
    </>
  );
}
