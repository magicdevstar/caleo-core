import { Helmet } from 'react-helmet-async';
// sections
import { SkillRequestsView } from 'src/sections/admin/userManagement/view';

// ----------------------------------------------------------------------

export default function SkillRequestsPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Skill Requests</title>
      </Helmet>

      <SkillRequestsView />
    </>
  );
}
