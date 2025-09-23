import { Navigate, useRoutes } from 'react-router-dom';
// config
import { PATH_AFTER_LOGIN } from 'src/config-global';
// hooks
import usePageTracking from 'src/hooks/use-page-tracking';
//
import { mainRoutes } from './main';

import { authRoutes } from './auth';
import { dashboardRoutes } from './dashboard';
import { externalRequestRoutes } from './externalRequests';
import { kioskRoutes } from './kiosk';

// ----------------------------------------------------------------------

export default function Router() {
  usePageTracking();

  return useRoutes([
    {
      path: '/',
      element: <Navigate to={PATH_AFTER_LOGIN} replace />,
    },

    // External requests
    ...externalRequestRoutes,

    // Auth routes
    ...authRoutes,

    // Dashboard routes
    ...dashboardRoutes,

    // Kiosk routes
    ...kioskRoutes,

    // Main routes
    ...mainRoutes,

    // No match 404
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
