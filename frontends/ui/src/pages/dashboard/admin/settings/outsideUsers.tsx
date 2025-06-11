import { Helmet } from 'react-helmet-async';
// sections
import OutsideUsersView from 'src/sections/admin/settings/view/outside-users-view';

// ----------------------------------------------------------------------

export default function OutsideUsers() {
  return (
    <>
      <Helmet>
        <title> Caleo: External Users </title>
      </Helmet>

      <OutsideUsersView />
    </>
  );
}
