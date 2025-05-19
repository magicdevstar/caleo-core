import { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { GraphQLError } from "graphql";
import { UserModel } from "../models/user";
import { IUser } from "../types/common";
import logger from "./logger";

export const userFromEvent = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
  users: UserModel
) => {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  const token = authHeader?.replace('Bearer', '').trim();

  if (!token) {
    logger.error('No token provided in Authorization header', { event });
    throw new GraphQLError('Unauthorized');
  }

  let sub;
  let familyName;
  if (token === process.env.SERVICE_ID && process.env.STAGE !== 'prod') {
    sub = process.env.SERVICE_ID!;
  } else {
    sub = event.requestContext.authorizer.jwt.claims.sub;
    familyName = event.requestContext.authorizer.jwt.claims.family_name;
  }

  let user = await users.collection.findOne<IUser>({ cognitoId: sub, removedAt: { $exists: false } });
  const originalUser = user || undefined;
  if (user?.superAdmin && familyName && familyName.includes('t:')) {
    const userId = familyName.split(':')[1];
    user = await users.get(userId);
  }

  if (!user) {
    logger.error('No user found', { user, sub, event });
    throw new GraphQLError('Unauthorized');
  }

  return {
    user: {
      id: user?._id?.toString(),
      ...user,
    },
    originalUser,
  };
};
