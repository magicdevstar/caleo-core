// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  minimalUI: 'https://mui.com/store/items/minimal-dashboard/',
  notApproved: `/not-approved`,
  lasdCompleteProfile: `/lasd/profile`,
  // AUTH
  auth: {
    amplify: {
      login: `${ROOTS.AUTH}/login`,
      verify: `${ROOTS.AUTH}/verify`,
      register: `${ROOTS.AUTH}/register`,
      newPassword: `${ROOTS.AUTH}/new-password`,
      forgotPassword: `${ROOTS.AUTH}/forgot-password`,
    },
  },
  kiosk: {
    root: '/kiosk/:eventId',
    userView: '/kiosk/:eventId/users/:userId',
    dashboard: '/events/:eventId/dashboard',
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    myOvertime: `${ROOTS.DASHBOARD}/overtime`,
    availableOvertime: `${ROOTS.DASHBOARD}/available/overtime`,
    upcomingOvertime: `${ROOTS.DASHBOARD}/upcoming/overtime`,
    rankOvertime: `${ROOTS.DASHBOARD}/rank/overtime`,
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
    },
    admin: {
      reports: `${ROOTS.DASHBOARD}/admin/reports`,
      overtime: {
        root: `${ROOTS.DASHBOARD}/admin/overtime`,
        events: `${ROOTS.DASHBOARD}/admin/overtime/events`,
        eventDetail: `${ROOTS.DASHBOARD}/admin/overtime/events/:eventId`,
        eventDashboard: `${ROOTS.DASHBOARD}/admin/overtime/events/:eventId/dashboard`,
        eventAssignmentDetail: `${ROOTS.DASHBOARD}/admin/overtime/events/:eventId/assignment/:assignmentId`,
        eventAssignmentShiftsDetail: `${ROOTS.DASHBOARD}/admin/overtime/events/:eventId/assignment/:assignmentId/shifts/:shiftId`,
        venues: `${ROOTS.DASHBOARD}/admin/overtime/venues`,
        shifts: `${ROOTS.DASHBOARD}/admin/overtime/shifts`,
        dynamicShiftFilter: `${ROOTS.DASHBOARD}/admin/overtime/dynamic-shift-filter`,
      },
      settings: {
        root: `${ROOTS.DASHBOARD}/admin/settings`,
        ranksAndSkill: `${ROOTS.DASHBOARD}/admin/settings/ranks-and-skills`,
        unitAndDivision: `${ROOTS.DASHBOARD}/admin/settings/unit-and-division`,
        department: `${ROOTS.DASHBOARD}/admin/settings/department`,
        notifications: `${ROOTS.DASHBOARD}/admin/settings/notifications`,
        notificationDetails: `${ROOTS.DASHBOARD}/admin/settings/notifications/:id`,
      },
      users: {
        root: `${ROOTS.DASHBOARD}/admin/users`,
        userDetail: `${ROOTS.DASHBOARD}/admin/users/:id`,
        requests: {
          account: `${ROOTS.DASHBOARD}/admin/users/request/account`,
          skills: `${ROOTS.DASHBOARD}/admin/users/request/skills`,
          equipment: `${ROOTS.DASHBOARD}/admin/users/request/equipment`,
          buffer: `${ROOTS.DASHBOARD}/admin/users/request/buffer`,
        },
      },
    }
  },
};
