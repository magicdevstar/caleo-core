import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
// auth
import { AuthGuard } from 'src/auth/guard';
// layouts
import { HeaderSimple as Header } from 'src/layouts/_common';
// components
import { LoadingScreen } from 'src/components/loading-screen';
import { lazyWithRetry } from 'src/utils/lazyRetry';

// ----------------------------------------------------------------------

const IndexPage = lazyWithRetry(() => import('src/pages/kiosk/event'));
const UserKioskPage = lazyWithRetry(() => import('src/pages/kiosk/user'));
const EventDashboard = lazyWithRetry(() => import('src/pages/kiosk/eventDashboard'));

// ----------------------------------------------------------------------

export const kioskRoutes = [
  {
    path: 'kiosk/:eventId',
    element: (
      <AuthGuard>
        <Header sx={{ position: 'initial' }} />
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
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
    children: [
      { element: <EventDashboard />, index: true },
    ],
  },
];
