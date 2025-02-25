import { APIGatewayEvent } from "aws-lambda";
import { createContext } from "../../../utils/createContext";
import logger from "../../../utils/logger";

export const handler = async (event: APIGatewayEvent) => {
  try {
    const context = await createContext();
    const orgId = event.pathParameters!.orgId!;
    const organization = await context.organizations.get(orgId);
    const {
      externalEventRequests = false,
      lasdEventFields = false
    } = organization?.features || {};
    return {
      externalEventRequests,
      lasdEventFields
    };
  } catch (error) {
    logger.error('Failed to fetch organization features', {error});
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to organization features',
      }),
    };
  }
}
