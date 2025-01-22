import { APIGatewayEvent } from "aws-lambda";
import logger from "../utils/logger";
import { createContext } from "../utils/createContext";

export const handler = async (event: APIGatewayEvent) => {
  try {
    const context = await createContext();
    const subdomain = event.queryStringParameters?.subdomain;
    if (!subdomain) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing subdomain',
        }),
      };
    }

    const foundMatchingSSOconfig = await context.organizations.getOrganizationSSOConfig(subdomain);
    if (!foundMatchingSSOconfig) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: 'No SSO config found for this subdomain',
        }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        enablePasswordLogin: foundMatchingSSOconfig.sso?.enablePasswordLogin,
      }),
    };
  } catch(error) {
    logger.error('Failed to find sso configuration', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to find SSO configuration',
      }),
    };
  }
};