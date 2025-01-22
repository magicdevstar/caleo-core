import { Helmet } from 'react-helmet-async';
// sections
import { RanksAndSkills } from 'src/sections/admin/settings/view';

// ----------------------------------------------------------------------

export default function AccountPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Ranks & Skills</title>
      </Helmet>

      <RanksAndSkills />
    </>
  );
}
