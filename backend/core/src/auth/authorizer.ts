import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';
import { APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';
import { JwtPayload } from 'jsonwebtoken';
import { Db } from 'mongodb';

import logger from './../utils/logger';
import { validateToken } from './jwt';
import { User } from './../__generated__/resolvers-types';
import { createContext } from '../utils/createContext';

interface AuthorizerSimpleResponse {
  isAuthorized: boolean;
  context?: {
    user?: User | null;
  };
}

let db: Db;

const authorizer = async (event: APIGatewayRequestAuthorizerEventV2): Promise<AuthorizerSimpleResponse> => {
  try {
    const authorizationHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authorizationHeader) throw new Error('No authorization header found');
    const token = authorizationHeader.replace('Bearer ', '');

    let sub;
    if (token === process.env.SERVICE_ID && process.env.STAGE !== 'prod') {
      sub = process.env.SERVICE_ID!;
    } else {
      const payload = await validateToken(token) as JwtPayload;
      sub = payload.sub;
    }

    const { users } = await createContext();
    const user = await users.findOne({ cognitoId: sub, removedAt: { $exists: false } });

    return {
      isAuthorized: true,
      context: {
        user,
      },
    };
  } catch(error) {
    logger.error('Authorizer failed', {error});
    return {
      isAuthorized: false,
    };
  }
};

export const handler = middy(authorizer)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
