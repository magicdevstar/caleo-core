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

export interface Context {
  organizations: OrganizationModel;
  users: UserModel;
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.STAGE !== 'prod',
});

export const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventV2RequestHandler<
    APIGatewayProxyEventV2WithLambdaAuthorizer<{
      myAuthorizerContext: string;
    }>
  >(),
  {
    middleware: [loggerMiddleware],
    context: async ({ event, context }) => {
      logger.addContext(context);
      const db = await mongodb.db(process.env.MONGODB_NAME!);

      return {
        organizations: new OrganizationModel(db),
        users: new UserModel(db),
        lambdaEvent: event,
        lambdaContext: context,
      };
    },
  }
);
