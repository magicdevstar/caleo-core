import { Helmet } from 'react-helmet-async';
// sections
import { View500 } from 'src/sections/error';

// ----------------------------------------------------------------------

export default function ErrorPage({ resetErrorBoundary }: { resetErrorBoundary: any }) {
  return (
    <>
      <Helmet>
        <title> Caleo: Error</title>
      </Helmet>

      <View500 resetErrorBoundary={resetErrorBoundary} />
    </>
  );
}
