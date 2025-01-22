import { Outlet } from 'react-router-dom';
// layouts
import CompactLayout from 'src/layouts/compact';
import { lazyWithRetry } from 'src/utils/lazyRetry';

// ----------------------------------------------------------------------

const Page404 = lazyWithRetry(() => import('src/pages/404'));
const NotApproved = lazyWithRetry(() => import('src/pages/NotApproved'));

// ----------------------------------------------------------------------

export const mainRoutes = [
  {
    element: (
      <CompactLayout>
        <Outlet />
      </CompactLayout>
    ),
    children: [
      { path: '404', element: <Page404 /> },
      { path: 'not-approved', element: <NotApproved /> },
    ],
  },
];
