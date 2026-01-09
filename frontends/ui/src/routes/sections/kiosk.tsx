import { Suspense } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
// auth
import { AuthGuard } from 'src/auth/guard';
// layouts
import { HeaderSimple as Header } from 'src/layouts/_common';
// components
import { LoadingScreen } from 'src/components/loading-screen';
import { lazyWithRetry } from 'src/utils/lazyRetry';
import AuthModernLayout from 'src/layouts/auth/modern';

// ----------------------------------------------------------------------

const IndexPage = lazyWithRetry(() => import('src/pages/kiosk/event'));
const UserKioskPage = lazyWithRetry(() => import('src/pages/kiosk/user'));

// ----------------------------------------------------------------------

function EventDashboardRedirect() {
  const { eventId } = useParams();
  return <Navigate to={`/dashboard/admin/event-management/dashboards/${eventId}`} replace />;
}

// ----------------------------------------------------------------------

export const kioskRoutes = [
  {
    path: 'kiosk/:eventId',
    element: (
      <AuthGuard>
        <Suspense fallback={<LoadingScreen />}>
          <AuthModernLayout maxWidth={{ md: '50%', sm: '100%' }}>
            <Outlet />
          </AuthModernLayout>
        </Suspense>
      </AuthGuard>
    ),
    children: [
      { element: <IndexPage />, index: true },
      { path: 'users/:userId', element: <UserKioskPage /> },
    ],
  },
  {
    path: 'events/:eventId/dashboard',
    element: (
      <AuthGuard>
        <Header sx={{ position: 'initial' }} />
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </AuthGuard>
    ),
    children: [{ element: <EventDashboardRedirect />, index: true }],
  },
];
