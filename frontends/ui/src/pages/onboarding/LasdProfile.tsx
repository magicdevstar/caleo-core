import { Helmet } from 'react-helmet-async';
// sections
import LasdCompleteProfile from 'src/sections/onboarding/views/lasd-profile';

// ----------------------------------------------------------------------

export default function LasdComplete() {
  return (
    <>
      <Helmet>
        <title>Caleo: Complete Profile</title>
      </Helmet>

      <LasdCompleteProfile />
    </>
  );
}
