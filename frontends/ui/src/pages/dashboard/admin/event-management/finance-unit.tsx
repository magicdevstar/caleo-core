import { Helmet } from 'react-helmet-async';
// sections
import FinanceUnitView from 'src/sections/admin/event-management/views/event-table';

// ----------------------------------------------------------------------

export default function FinanceUnit() {
  return (
    <>
      <Helmet>
        <title> Caleo: Finance Unit</title>
      </Helmet>

      <FinanceUnitView />
    </>
  );
}
