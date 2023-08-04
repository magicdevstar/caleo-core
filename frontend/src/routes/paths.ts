import { _id } from 'src/_mock/assets';

// ----------------------------------------------------------------------

const MOCK_ID = _id[1];

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  minimalUI: 'https://mui.com/store/items/minimal-dashboard/',
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
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    availableOvertime: `${ROOTS.DASHBOARD}/available/overtime`,
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
    },
    admin: {
      reports: `${ROOTS.DASHBOARD}/admin/reports`,
      overtime: {
        root: `${ROOTS.DASHBOARD}/admin/overtime`,
        events: `${ROOTS.DASHBOARD}/admin/overtime/events`,
        venues: `${ROOTS.DASHBOARD}/admin/overtime/venues`,
        shifts: `${ROOTS.DASHBOARD}/admin/overtime/shifts`,
      },
      settings: {
        root: `${ROOTS.DASHBOARD}/admin/settings`,
        ranksAndSkill: `${ROOTS.DASHBOARD}/admin/settings/ranks-and-skills`,
        department: `${ROOTS.DASHBOARD}/admin/settings/department`,
        notifications: `${ROOTS.DASHBOARD}/admin/settings/notifications`,
      },
      users: {
        root: `${ROOTS.DASHBOARD}/admin/users`,
        requests: `${ROOTS.DASHBOARD}/admin/users/requests`,
      },
    }
  },
};
