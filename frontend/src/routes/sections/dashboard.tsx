import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
// auth
import { AuthGuard } from 'src/auth/guard';
// layouts
import DashboardLayout from 'src/layouts/dashboard';
// components
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

const IndexPage = lazy(() => import('src/pages/dashboard/myOvertime'));
const AvailableOvertime = lazy(() => import('src/pages/dashboard/availableOvertime'));
const MyProfile = lazy(() => import('src/pages/dashboard/user/account'));
const EmptyPage = lazy(() => import('src/sections/empty/view'));
const RanksAndSkills = lazy(() => import('src/pages/dashboard/admin/settings/ranksAndSkills'));
const AdminNotifications = lazy(() => import('src/pages/dashboard/admin/settings/notifications'));
const EditNotification = lazy(() => import('src/pages/dashboard/admin/settings/editNotification'));
const UserSearch = lazy(() => import('src/pages/dashboard/admin/userManagement/userSearch'));
const AdminUserDetails = lazy(() => import('src/pages/dashboard/admin/userManagement/userDetails'));
const OvertimeSettings = lazy(() => import('src/pages/dashboard/admin/settings/overtime'));
const DepartmentSettings = lazy(() => import('src/pages/dashboard/admin/settings/department'));

// ----------------------------------------------------------------------

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { element: <IndexPage />, index: true },
      { path: 'available/overtime', element: <AvailableOvertime /> },
      { path: 'user', element: <MyProfile /> },
      {
        path: 'admin',
        children: [
          { path: 'reports', element: <EmptyPage title='Reports' /> },
          {
            path: 'overtime',
            children: [
              { path: 'events', element: <EmptyPage title='Events' />, index: true },
              { path: 'venues', element: <EmptyPage title='Venues' /> },
              { path: 'shifts', element: <EmptyPage title='Shifts' /> },
            ]
          },
          {
            path: 'users',
            children: [
              { element: <UserSearch />, index: true },
              { path: ':id', element: <AdminUserDetails /> },
              { path: 'requests', element: <EmptyPage title='Manage Requests' /> },
            ]
          },
          {
            path: 'settings',
            children: [
              { element: <OvertimeSettings />, index: true },
              { path: 'ranks-and-skills', element: <RanksAndSkills /> },
              { path: 'department', element: <DepartmentSettings /> },
              { path: 'notifications', element: <AdminNotifications /> },
              { path: 'notifications/:id', element: <EditNotification /> },
            ]
          }
        ],
      },
    ],
  },
];
