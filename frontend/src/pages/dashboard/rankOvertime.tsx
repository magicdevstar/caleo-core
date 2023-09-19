import { Helmet } from 'react-helmet-async';
// sections
import LotterySelectView from 'src/sections/lottery-select/view/lottery-select-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> Caleo: Rank Overtime</title>
      </Helmet>

      <LotterySelectView />
    </>
  );
}
