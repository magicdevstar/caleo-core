import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
// auth
import { AuthGuard } from 'src/auth/guard';
// layouts
import DashboardLayout from 'src/layouts/dashboard';
// components
import { LoadingScreen } from 'src/components/loading-screen';
import { lazyWithRetry } from 'src/utils/lazyRetry';

// ----------------------------------------------------------------------

const IndexPage = lazyWithRetry(() => import('src/pages/dashboard/dashboard'));
const MyOvertime = lazyWithRetry(() => import('src/pages/dashboard/myOvertime'));
const AvailableOvertime = lazyWithRetry(() => import('src/pages/dashboard/availableOvertime'));
const UpcomingOvertime = lazyWithRetry(() => import('src/pages/dashboard/upcomingOvertime'));
const RankOvertime = lazyWithRetry(() => import('src/pages/dashboard/rankOvertime'));
const MyProfile = lazyWithRetry(() => import('src/pages/dashboard/user/account'));
const RanksAndSkills = lazyWithRetry(() => import('src/pages/dashboard/admin/settings/ranksAndSkills'));
const UnitAndDivision = lazyWithRetry(() => import('src/pages/dashboard/admin/settings/unitAndDivision'));
const MiscLASD = lazyWithRetry(() => import('src/pages/dashboard/admin/settings/miscLASD'));
const AdminNotifications = lazyWithRetry(() => import('src/pages/dashboard/admin/settings/notifications'));
const EditNotification = lazyWithRetry(() => import('src/pages/dashboard/admin/settings/editNotification'));
const UserSearch = lazyWithRetry(() => import('src/pages/dashboard/admin/userManagement/userSearch'));
const SkillRequests = lazyWithRetry(() => import('src/pages/dashboard/admin/userManagement/skillRequests'));
const EquipmentRequests = lazyWithRetry(() => import('src/pages/dashboard/admin/userManagement/equipmentRequests'));
const ShiftBufferRequests = lazyWithRetry(() => import('src/pages/dashboard/admin/userManagement/shiftBufferRequests'));
const AccountRequests = lazyWithRetry(() => import('src/pages/dashboard/admin/userManagement/accountRequests'));
const AdminUserDetails = lazyWithRetry(() => import('src/pages/dashboard/admin/userManagement/userDetails'));
const Reports = lazyWithRetry(() => import('src/pages/dashboard/admin/reports'));
const OvertimeSettings = lazyWithRetry(() => import('src/pages/dashboard/admin/settings/overtime'));
const DepartmentSettings = lazyWithRetry(() => import('src/pages/dashboard/admin/settings/department'));
const Venues = lazyWithRetry(() => import('src/pages/dashboard/admin/overtimeManagement/venues'));
const DynamicShiftFilter = lazyWithRetry(() => import('src/pages/dashboard/admin/overtimeManagement/dynamicShiftFilter'));
const EditVenue = lazyWithRetry(() => import('src/pages/dashboard/admin/overtimeManagement/editVenue'));
const Events = lazyWithRetry(() => import('src/pages/dashboard/admin/overtimeManagement/events'));
const EventsTemplates = lazyWithRetry(() => import('src/pages/dashboard/admin/overtimeManagement/templates/events'));
const EventDashboards = lazyWithRetry(() => import('src/pages/dashboard/admin/overtimeManagement/eventDashboards'));
const EventsTemplateEdit = lazyWithRetry(() => import('src/pages/dashboard/admin/overtimeManagement/templates/editEvent'));
const AssignmentsTemplateEdit = lazyWithRetry(() => import('src/pages/dashboard/admin/overtimeManagement/templates/editAssignment'));
const EditEvent = lazyWithRetry(() => import('src/pages/dashboard/admin/overtimeManagement/editEvent'));
const EditEventAssignment = lazyWithRetry(() => import('src/pages/dashboard/admin/overtimeManagement/editAssignment'));
const EditEventAssignmentShift = lazyWithRetry(() => import('src/pages/dashboard/admin/overtimeManagement/editShift'));
const IncidentForm = lazyWithRetry(() => import('src/pages/dashboard/incidents/incident-form'));
const OutsideUsers = lazyWithRetry(() => import('src/pages/dashboard/admin/settings/outsideUsers'));
const FinanceUnit = lazyWithRetry(() => import('src/pages/dashboard/admin/event-management/finance-unit'));
const FinanceUnitDetail = lazyWithRetry(() => import('src/pages/dashboard/admin/event-management/finance-unit-detail'));

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
      { path: 'overtime', element: <MyOvertime /> },
      { path: 'available/overtime', element: <AvailableOvertime /> },
      { path: 'upcoming/overtime', element: <UpcomingOvertime /> },
      { path: 'rank/overtime', element: <RankOvertime /> },
      { path: 'incident/:id/form', element: <IncidentForm /> },
      { path: 'user', element: <MyProfile /> },
      {
        path: 'admin',
        children: [
          { path: 'reports', element: <Reports /> },
          {
            path: 'event-management',
            children: [
              { path: 'dashboards', element: <EventDashboards /> },
              { path: 'finance-unit', element: <FinanceUnit /> },
              { path: 'finance-unit/:eventId', element: <FinanceUnitDetail /> },
            ]
          },
          {
            path: 'overtime',
            children: [
              { path: 'events', element: <Events />, index: true },
              { path: 'events/:eventId', element: <EditEvent /> },
              { path: 'events/:eventId/assignment/:assignmentId', element: <EditEventAssignment /> },
              { path: 'events/:eventId/assignment/:assignmentId/shifts/:shiftId', element: <EditEventAssignmentShift /> },
              { path: 'venues', element: <Venues /> },
              { path: 'venues/:id', element: <EditVenue /> },
              { path: 'dynamic-shift-filter', element: <DynamicShiftFilter /> },
              {
                path: 'templates',
                children: [
                  { path: 'events', element: <EventsTemplates />, index: true },
                  { path: 'events/:eventId', element: <EventsTemplateEdit /> },
                  { path: 'events/:eventId/assignment/:assignmentId', element: <AssignmentsTemplateEdit /> },
                ]
              }
            ]
          },
          {
            path: 'users',
            children: [
              { element: <UserSearch />, index: true },
              { path: ':id', element: <AdminUserDetails /> },
              {
                path: 'request',
                children: [
                  { path: 'account', element: <AccountRequests /> },
                  { path: 'skills', element: <SkillRequests /> },
                  { path: 'equipment', element: <EquipmentRequests /> },
                  { path: 'buffer', element: <ShiftBufferRequests /> }
                ]
              },
            ]
          },
          {
            path: 'settings',
            children: [
              { element: <OvertimeSettings />, index: true },
              { path: 'ranks-and-skills', element: <RanksAndSkills /> },
              { path: 'unit-and-division', element: <UnitAndDivision /> },
              { path: 'misc-lasd', element: <MiscLASD /> },
              { path: 'department', element: <DepartmentSettings /> },
              { path: 'notifications', element: <AdminNotifications /> },
              { path: 'notifications/:id', element: <EditNotification /> },
              { path: 'outside-users', element: <OutsideUsers /> },
            ]
          }
        ],
      },
    ],
  },
];
