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
import mongoConnect from './utils/mongo';

const server = new ApolloServer({
  typeDefs,
  resolvers,
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
      const mongo = await mongoConnect();
      logger.addContext(context);
      return {
        mongo,
        lambdaEvent: event,
        lambdaContext: context,
      };
    },
  }
);
