import { Helmet } from 'react-helmet-async';
// sections
import { TemplateEventsView } from 'src/sections/admin/overtimeManagement/views';

// ----------------------------------------------------------------------

export default function EventsPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Event Templates</title>
      </Helmet>

      <TemplateEventsView />
    </>
  );
}
