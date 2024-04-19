// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  ADMIN: '/admin',
};

// ----------------------------------------------------------------------

export const paths = {
  minimalUI: 'https://mui.com/store/items/minimal-dashboard/',
  notApproved: `/not-approved`,
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
  // ADMIN
  admin: {
    organizations: {
      root: `${ROOTS.ADMIN}/organizations`,
    },
  },
};
