import { Helmet } from 'react-helmet-async';
// sections
import FinanceUnitDetailView from 'src/sections/admin/event-management/views/finance-unit-detail';

// ----------------------------------------------------------------------

export default function FinanceUnitDetail() {
  return (
    <>
      <Helmet>
        <title> Caleo: Finance Unit Detail</title>
      </Helmet>

      <FinanceUnitDetailView />
    </>
  );
}
