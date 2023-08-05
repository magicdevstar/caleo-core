import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';
import { APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';
import { JwtPayload } from 'jsonwebtoken';
import { Db } from 'mongodb';

import logger from './../utils/logger';
import mongodb from './../utils/mongo';
import { validateToken } from './jwt';
import { User } from './../__generated__/resolvers-types';
import { UserModel } from '../models/user';

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

    if (!db) {
      db = await mongodb.db(process.env.MONGODB_NAME!);
    }
    const users = new UserModel(db);
    const user = await users.findOne({ cognitoId: sub });

    return {
      isAuthorized: true,
      context: {
        user,
      },
    };
  } catch(error) {
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
