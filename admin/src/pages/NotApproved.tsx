import { Helmet } from 'react-helmet-async';
// sections
import NotApprovedView from 'src/sections/error/NotApproved-view';

// ----------------------------------------------------------------------

export default function NotApproved() {
  return (
    <>
      <Helmet>
        <title>Caleo Admin: Unauthorized</title>
      </Helmet>

      <NotApprovedView />
    </>
  );
}
