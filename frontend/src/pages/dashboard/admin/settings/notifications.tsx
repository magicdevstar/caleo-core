import { Helmet } from 'react-helmet-async';
// sections
import { NotificationsView } from 'src/sections/admin/settings/view';

// ----------------------------------------------------------------------

export default function AccountPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Notifications</title>
      </Helmet>

      <NotificationsView />
    </>
  );
}
