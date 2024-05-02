import { ObjectId } from "mongodb";
import difference from 'lodash.difference';
import uniq from 'lodash.uniq';
import { Assignment, VenueStatus } from "../__generated__/resolvers-types";
import { createContext } from "../utils/createContext";
import logger from "../utils/logger";
import { APIGatewayEvent } from "aws-lambda";

export const handler = async (event: APIGatewayEvent) => {
  try {
    const context = await createContext();
    const { queryStringParameters: params } = event;
    const orgId = params?.orgId;
    if (!orgId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing orgId',
        }),
      };
    }
    const organization = await context.organizations.get(orgId);
    if (!organization?.features?.externalEventRequests) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'This org does not allow external requests',
        }),
      };
    }

    const {
      items,
      total
    } = await context.venues.search({
      skip: params?.skip ? parseInt(params.skip) : 0,
      limit: params?.limit ? parseInt(params.limit) : 10,
      query: params?.query,
      status: VenueStatus.Active,
    });
    
    return {
      total,
      items: items.map(({
        id,
        name,
        address,
        city,
        state,
        zip,
        notes,
      }) => ({
        id,
        name,
        address,
        city,
        state,
        zip,
        notes,
      })),
    };
  } catch (error) {
    logger.error('Failed to fetch events', {error});
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to fetch venues',
      }),
    };
  }
}
