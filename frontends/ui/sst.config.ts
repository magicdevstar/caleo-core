/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "ui",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    new sst.aws.StaticSite("CoreUI", {
      environment: {
        REACT_APP_HOST_API: process.env.REACT_APP_HOST_API!,
        REACT_APP_ASSETS_API: process.env.REACT_APP_ASSETS_API!,
        REACT_APP_MAPBOX_API: process.env.REACT_APP_MAPBOX_API!,
        REACT_APP_APOLLO_API: process.env.REACT_APP_APOLLO_API!,
        REACT_APP_AWS_AMPLIFY_USER_POOL_ID: process.env.REACT_APP_AWS_AMPLIFY_USER_POOL_ID!,
        REACT_APP_AWS_AMPLIFY_USER_POOL_WEB_CLIENT_ID: process.env.REACT_APP_AWS_AMPLIFY_USER_POOL_WEB_CLIENT_ID!,
        REACT_APP_AWS_AMPLIFY_REGION: process.env.REACT_APP_AWS_AMPLIFY_REGION!,
        REACT_APP_AWS_AMPLIFY_USER_POOL_DOMAIN: process.env.REACT_APP_AWS_AMPLIFY_USER_POOL_DOMAIN!,
        REACT_APP_VAPID_PUBLIC_KEY: process.env.REACT_APP_VAPID_PUBLIC_KEY!,
      },
      build: {
        command: "npm run build",
        output: 'build',
      },
      domain: {
        name: process.env.DOMAIN_NAME!,
        aliases: process.env.DOMAIN_ALIASES!.split(","),
      }
    });
  },
});
