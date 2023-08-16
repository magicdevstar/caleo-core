import { Helmet } from 'react-helmet-async';
// sections
import DepartmentView from 'src/sections/admin/settings/view/department-view';

// ----------------------------------------------------------------------

export default function AccountPage() {
  return (
    <>
      <Helmet>
        <title> Caleo: Department </title>
      </Helmet>

      <DepartmentView />
    </>
  );
}
