import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// auth
import { AuthGuard } from 'src/auth/guard';
// components
import { LoadingScreen } from 'src/components/loading-screen';
import { lazyWithRetry } from 'src/utils/lazyRetry';
import SimpleLayout from 'src/layouts/simple';
import { paths } from '../paths';

// ----------------------------------------------------------------------

const OrganizationListView = lazyWithRetry(() => import('src/pages/admin/organization/list'));
const OrganizationDetailsView = lazyWithRetry(() => import('src/pages/admin/organization/details'));

// ----------------------------------------------------------------------

export const adminRoutes = [
  {
    path: 'admin',
    element: (
      <AuthGuard>
        <SimpleLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </SimpleLayout>
      </AuthGuard>
    ),
    children: [
      { element: <Navigate replace to={paths.admin.organizations.root} />, index: true },
      {
        path: 'organizations',
        children: [
          { element: <OrganizationListView />, index: true },
          { path: ':orgId', element: <OrganizationDetailsView /> },
        ],
      },
    ],
  },
];
