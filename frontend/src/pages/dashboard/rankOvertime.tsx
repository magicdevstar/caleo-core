import { Helmet } from 'react-helmet-async';
// sections
import LotteryViewGuard from 'src/sections/lottery-select/view/lottery-view-guard';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> Caleo: Lottery</title>
      </Helmet>

      <LotteryViewGuard />
    </>
  );
}
