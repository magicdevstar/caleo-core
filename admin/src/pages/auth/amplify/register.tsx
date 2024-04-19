import { Helmet } from 'react-helmet-async';
// sections
import { AmplifyRegisterView } from 'src/sections/auth/amplify';

// ----------------------------------------------------------------------

export default function RegisterPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Register</title>
      </Helmet>

      <AmplifyRegisterView />
    </>
  );
}
