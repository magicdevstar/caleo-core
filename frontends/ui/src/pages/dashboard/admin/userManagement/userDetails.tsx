import { Helmet } from 'react-helmet-async';
// sections
import { UserDetail } from 'src/sections/admin/userManagement/view';

// ----------------------------------------------------------------------

export default function AdminUserDetail() {
  return (
    <>
      <Helmet>
        <title> Caleo: User Detail</title>
      </Helmet>

      <UserDetail />
    </>
  );
}
