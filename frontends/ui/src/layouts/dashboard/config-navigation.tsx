import { useMemo } from 'react';
// routes
import { paths } from 'src/routes/paths';
// components
import SvgColor from 'src/components/svg-color';
import { useAuthContext } from 'src/auth/hooks';
import { useFeatures } from 'src/hooks/use-features';

// ----------------------------------------------------------------------

const icon = (name: string, path: string = '/assets/icons/navbar') => (
  <SvgColor src={`${path}/${name}.svg`} sx={{ width: 1, height: 1 }} />
  // OR
  // <Iconify icon="fluent:mail-24-filled" />
  // https://icon-sets.iconify.design/solar/
  // https://www.streamlinehq.com/icons
);

const ICONS = {
  job: icon('ic_job'),
  blog: icon('ic_blog'),
  chat: icon('ic_chat'),
  mail: icon('ic_mail'),
  user: icon('ic_user'),
  file: icon('ic_file'),
  lock: icon('ic_lock'),
  tour: icon('ic_tour'),
  order: icon('ic_order'),
  label: icon('ic_label'),
  blank: icon('ic_blank'),
  kanban: icon('ic_kanban'),
  folder: icon('ic_folder'),
  banking: icon('ic_banking'),
  booking: icon('ic_booking'),
  invoice: icon('ic_invoice'),
  product: icon('ic_product'),
  calendar: icon('ic_calendar'),
  disabled: icon('ic_disabled'),
  external: icon('ic_external'),
  menuItem: icon('ic_menu_item'),
  ecommerce: icon('ic_ecommerce'),
  analytics: icon('ic_analytics'),
  dashboard: icon('ic_dashboard'),
  settings: icon('ic_setting', '/assets/icons/setting'),
};

// ----------------------------------------------------------------------

export function useNavData() {
  const { user } = useAuthContext()
  const {
    equipment,
    lottery,
    lasdUserFields,
    lasdEventFields,
    eventTemplates,
    financeUnit,
    kiosk,
    outsideUserList,
    operationsUnit
  } = useFeatures();

  const data = useMemo(
    () => [
      // OVERVIEW
      // ----------------------------------------------------------------------
      {
        subheader: 'NAVIGATION',
        items: [
          { title: 'My Dashboard', path: paths.dashboard.root, icon: ICONS.label },
          { title: 'My Overtime', path: paths.dashboard.myOvertime, icon: ICONS.job },
          { title: 'Available Overtime', path: paths.dashboard.availableOvertime, icon: ICONS.calendar },
          { title: 'Upcoming Overtime', path: paths.dashboard.upcomingOvertime, icon: ICONS.label },
          ...(lottery ? [{ title: 'Rank Overtime', path: paths.dashboard.rankOvertime, icon: ICONS.kanban }] : []),
          {
            title: 'My Profile',
            path: paths.dashboard.user.root,
            icon: ICONS.user,
          },
        ],
      },
      ...(user?.role === 'admin' ? [
        // MANAGEMENT
        // ----------------------------------------------------------------------
        {
          subheader: 'Admin',
          items: [
            {
              title: 'Overtime Management',
              path: paths.dashboard.admin.overtime.root,
              icon: ICONS.menuItem,
              children: [
                { title: 'Events', path: paths.dashboard.admin.overtime.events, internalChildRoutes: true },
                ...(eventTemplates ? [
                  { title: 'Event Templates', path: paths.dashboard.admin.overtime.templates.events, internalChildRoutes: true }
                ] : []),
                { title: 'Venues', path: paths.dashboard.admin.overtime.venues, internalChildRoutes: true },
                { title: 'Dynamic Shift Filter', path: paths.dashboard.admin.overtime.dynamicShiftFilter },
              ],
            },
            ...(kiosk ? [
              {
                title: 'Event Management',
                path: paths.dashboard.admin.eventManagement.root,
                icon: ICONS.tour,
                children: [
                  { title: 'Resource Unit', path: paths.dashboard.admin.eventManagement.resourceUnit, internalChildRoutes: true },
                  ...(operationsUnit ? [
                    { title: 'Operations Unit', path: paths.dashboard.admin.eventManagement.operationsTable, internalChildRoutes: true },
                  ] : []),
                  ...(financeUnit ? [
                    { title: 'Finance Unit', path: paths.dashboard.admin.eventManagement.financeUnit, internalChildRoutes: true },
                  ] : [])
                ],
              }
            ] : []),
            {
              title: 'User Management',
              path: paths.dashboard.admin.users.root,
              icon: ICONS.user,
              children: [
                { title: 'Search Users', path: paths.dashboard.admin.users.root, internalChildRoutes: true, internalChildRoutesExclude: '/request' },
                { title: 'Account Requests', path: paths.dashboard.admin.users.requests.account },
                { title: 'Skill Requests', path: paths.dashboard.admin.users.requests.skills },
                ...(equipment ? [{ title: 'Equipment Requests', path: paths.dashboard.admin.users.requests.equipment }] : []),
                { title: 'Shift Buffer Requests', path: paths.dashboard.admin.users.requests.buffer },
              ],
            },
            {
              title: 'Reports',
              path: paths.dashboard.admin.reports,
              icon: ICONS.analytics,
            },
            {
              title: 'Settings',
              path: paths.dashboard.admin.settings.root,
              icon: ICONS.settings,
              children: [
                { title: 'Overtime', path: paths.dashboard.admin.settings.root },
                { title: equipment ? 'Ranks, Skills & Equipment' : 'Ranks & Skills', path: paths.dashboard.admin.settings.ranksAndSkill },
                ...(lasdUserFields ? [{ title: 'Unit and Division', path: paths.dashboard.admin.settings.unitAndDivision }] : []),
                ...(lasdEventFields ? [{ title: 'EAP/IAP', path: paths.dashboard.admin.settings.miscLASD }] : []),
                ...(outsideUserList ? [{ title: 'External Users', path: paths.dashboard.admin.settings.outsideUsers }] : []),
                { title: 'Department', path: paths.dashboard.admin.settings.department },
                { title: 'Notifications', path: paths.dashboard.admin.settings.notifications, internalChildRoutes: true },
              ],
            },
          ],
        },
      ] : [])
    ],
    [
      kiosk,
      user?.role,
      equipment,
      financeUnit,
      operationsUnit,
      lottery,
      lasdUserFields,
      eventTemplates,
      outsideUserList,
      lasdEventFields
    ]
  );

  return data;
}
