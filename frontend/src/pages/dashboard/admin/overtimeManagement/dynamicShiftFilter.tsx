import { Helmet } from 'react-helmet-async';
// sections
import { DynamicShiftFilterView } from 'src/sections/admin/overtimeManagement/views';

// ----------------------------------------------------------------------

export default function DynamicShiftFilterPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Dynamic Shift Filter</title>
      </Helmet>

      <DynamicShiftFilterView />
    </>
  );
}
