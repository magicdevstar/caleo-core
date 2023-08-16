import { Helmet } from 'react-helmet-async';
// sections
import { EditNotification } from 'src/sections/admin/settings/view';

// ----------------------------------------------------------------------

export default function AccountPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Edit Notification</title>
      </Helmet>

      <EditNotification />
    </>
  );
}
