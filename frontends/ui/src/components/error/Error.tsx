import { debounce } from 'lodash';
// Amplify
import { Auth } from '@aws-amplify/auth';
import { ErrorBoundary } from 'react-error-boundary';
import { APOLLO_API } from 'src/config-global';
import ErrorPage from 'src/pages/500';

// ----------------------------------------------------------------------

const forwardError = debounce(async (error: Error, info: { componentStack: string }) => {
  const session = await Auth.currentSession();
    const token = session.getIdToken().getJwtToken();
    const payload = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      info,
    };
    await fetch(`${APOLLO_API}errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
}, 1000);

export default function ErrorComponent({
  children,
}: any) {
  return (
    <ErrorBoundary fallbackRender={ErrorPage} onError={forwardError as any}>
      {children}
    </ErrorBoundary>
  );
}
