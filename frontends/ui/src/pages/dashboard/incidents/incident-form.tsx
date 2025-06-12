import { Helmet } from 'react-helmet-async';
import IncidentFormView from 'src/sections/dashboard/views/incident-form-view';
// sections


// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> Caleo: Incident Form</title>
      </Helmet>

      <IncidentFormView />
    </>
  );
}
