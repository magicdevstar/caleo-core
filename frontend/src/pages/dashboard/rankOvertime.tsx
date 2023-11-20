import { Helmet } from 'react-helmet-async';
// sections
import LotteryView from 'src/sections/lottery-select/view/lottery-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> Caleo: Lottery</title>
      </Helmet>

      <LotteryView />
    </>
  );
}
