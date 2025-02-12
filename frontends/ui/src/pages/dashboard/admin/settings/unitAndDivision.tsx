import { Helmet } from 'react-helmet-async';
// sections
import { UnitAndDivision } from 'src/sections/admin/settings/view';

// ----------------------------------------------------------------------

export default function UnitAndDivisionPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Unit & Division</title>
      </Helmet>

      <UnitAndDivision />
    </>
  );
}
