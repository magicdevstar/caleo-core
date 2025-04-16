import { Helmet } from 'react-helmet-async';
// sections
import { TemplateEventsEditView } from 'src/sections/admin/overtimeManagement/views';

// ----------------------------------------------------------------------

export default function EditEventTemplate() {
  return (
    <>
      <Helmet>
        <title> Caleo: Edit Event Template</title>
      </Helmet>

      <TemplateEventsEditView />
    </>
  );
}
