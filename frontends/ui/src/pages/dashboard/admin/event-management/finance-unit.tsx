import { Helmet } from 'react-helmet-async';
// sections
import FinanceUnitView from 'src/sections/admin/event-management/views/finance-unit';

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
