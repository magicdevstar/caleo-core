// API
// ----------------------------------------------------------------------

export const AMPLIFY_API = {
  userPoolId: process.env.VITE_AWS_AMPLIFY_USER_POOL_ID,
  userPoolWebClientId: process.env.VITE_AWS_AMPLIFY_USER_POOL_WEB_CLIENT_ID,
  region: process.env.VITE_AWS_AMPLIFY_REGION,
};

export const APOLLO_API = process.env.VITE_APOLLO_API;

// ROOT PATH AFTER LOGIN SUCCESSFUL
