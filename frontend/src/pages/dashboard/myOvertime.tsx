import { Helmet } from 'react-helmet-async';
// sections
import MyOvertimeView from 'src/sections/myOvertime/views/my-overtime-veiw';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> Caleo: My Overtime</title>
      </Helmet>

      <MyOvertimeView />
    </>
  );
}
