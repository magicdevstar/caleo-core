import { Helmet } from 'react-helmet-async';
// sections
import { TemplateAssignmentsEditView } from 'src/sections/admin/overtimeManagement/views';

// ----------------------------------------------------------------------

export default function EditAssignmentTemplate() {
  return (
    <>
      <Helmet>
        <title> Caleo: Edit Assignment Template</title>
      </Helmet>

      <TemplateAssignmentsEditView />
    </>
  );
}
