import { Helmet } from 'react-helmet-async';
// sections
import { AmplifyNewPasswordView } from 'src/sections/auth/amplify';

// ----------------------------------------------------------------------

export default function NewPasswordPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: New Password</title>
      </Helmet>

      <AmplifyNewPasswordView />
    </>
  );
}
