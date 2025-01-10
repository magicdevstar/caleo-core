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
import { Context, createContext } from './utils/createContext';
import { User } from './__generated__/resolvers-types';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.STAGE !== 'prod',
});

export const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventV2RequestHandler<
    APIGatewayProxyEventV2WithLambdaAuthorizer<{
      user?: User;
      originalUser?: User;
    }>
  >(),
  {
    middleware: [loggerMiddleware],
    context: async ({ event, context }): Promise<Context> => {
      try {
        logger.addContext(context);
        logger.setPersistentLogAttributes({
          apiGatewayRequestId: event.requestContext.requestId,
        });
        const classContext = await createContext();
        classContext.user = classContext.users.convertToModel(event.requestContext?.authorizer?.lambda?.user);
        classContext.originalUser = classContext.users.convertToModel(event.requestContext?.authorizer?.lambda?.originalUser);
        classContext.lambdaEvent = event;
        classContext.lambdaContext = context;
        if (event.requestContext?.authorizer?.lambda?.user) {
          classContext.organization = await classContext.organizations.get(event.requestContext?.authorizer?.lambda?.user.member.orgId) as any;
        }
  
        return classContext;
      } catch(error) {
        logger.error('Error creating context', {error});
        throw error;
      }
    },
  }
);
