import { Helmet } from 'react-helmet-async';
// sections
import OvertimeView from 'src/sections/admin/settings/view/overtime-view';

// ----------------------------------------------------------------------

export default function AccountPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Overtime </title>
      </Helmet>

      <OvertimeView />
    </>
  );
}
