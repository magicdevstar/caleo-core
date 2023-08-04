import { Helmet } from 'react-helmet-async';
// sections
import EmptyView from 'src/sections/empty/view';

// ----------------------------------------------------------------------

const title = "Available Overtime"
export default function Page() {
  return (
    <>
      <Helmet>
        <title> Caleo: {title}</title>
      </Helmet>

      <EmptyView title={title} />
    </>
  );
}
