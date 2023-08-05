import {
  ApolloServer
} from '@apollo/server';
import {
  startServerAndCreateLambdaHandler,
  handlers
} from '@as-integrations/aws-lambda';
import type { APIGatewayProxyEventV2WithLambdaAuthorizer } from 'aws-lambda';
import typeDefs from './graphql/typedefs';
import logger, { loggerMiddleware } from './utils/logger';
import resolvers from './graphql/resolvers';
import mongodb from './utils/mongo';
import { OrganizationModel } from './models/organization';
import { UserModel } from './models/user';
import { Db } from 'mongodb';
import { User } from './__generated__/resolvers-types';
import { RankModel } from './models/rank';

export interface Context {
  organizations: OrganizationModel;
  users: UserModel;
  ranks: RankModel;
  user?: User;
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.STAGE !== 'prod',
});

let db: Db;

export const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventV2RequestHandler<
    APIGatewayProxyEventV2WithLambdaAuthorizer<{
      user?: User;
    }>
  >(),
  {
    middleware: [loggerMiddleware],
    context: async ({ event, context }) => {
      logger.addContext(context);
      if (!db) {
        db = await mongodb.db(process.env.MONGODB_NAME!);
      }

      return {
        organizations: new OrganizationModel(db),
        users: new UserModel(db),
        ranks: new RankModel(db),
        user: event.requestContext.authorizer.lambda.user,
        lambdaEvent: event,
        lambdaContext: context,
      };
    },
  }
);
