// API
// ----------------------------------------------------------------------

export const AMPLIFY_API = {
  identityPoolId: import.meta.env.VITE_AWS_AMPLIFY_USER_POOL_ID,
  region: import.meta.env.VITE_AWS_AMPLIFY_REGION,
  identityPoolRegion: import.meta.env.VITE_AWS_AMPLIFY_REGION,
  userPoolId: import.meta.env.VITE_AWS_AMPLIFY_USER_POOL_ID,
  userPoolWebClientId: import.meta.env.VITE_AWS_AMPLIFY_USER_POOL_WEB_CLIENT_ID,
};

export const APOLLO_API = import.meta.env.VITE_APOLLO_API;

// ROOT PATH AFTER LOGIN SUCCESSFUL
