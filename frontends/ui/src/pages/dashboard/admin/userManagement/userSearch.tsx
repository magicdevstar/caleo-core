import { Helmet } from 'react-helmet-async';
// sections
import { UserSearch } from 'src/sections/admin/userManagement/view';

// ----------------------------------------------------------------------

export default function AccountPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: User Search</title>
      </Helmet>

      <UserSearch />
    </>
  );
}
