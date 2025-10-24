import { Helmet } from 'react-helmet-async';
// sections
import { MiscView } from 'src/sections/admin/settings/view';

// ----------------------------------------------------------------------

export default function MiscLASDPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Division, Group & Branch</title>
      </Helmet>

      <MiscView />
    </>
  );
}
