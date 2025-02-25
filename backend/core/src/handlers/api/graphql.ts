import {
  ApolloServer
} from '@apollo/server';
import {
  startServerAndCreateLambdaHandler,
  handlers
} from '@as-integrations/aws-lambda';
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import typeDefs from '../../graphql/typedefs';
import logger, { loggerMiddleware } from '../../utils/logger';
import resolvers from '../../graphql/resolvers';
import { Context, createContext } from '../../utils/createContext';
import { userFromEvent } from '../../utils/userFromEvent';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.STAGE !== 'prod',
});

export const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventV2RequestHandler<
    APIGatewayProxyEventV2WithJWTAuthorizer
  >(),
  {
    middleware: [loggerMiddleware],
    context: async ({ event, context }): Promise<Context> => {
      try {
        logger.addContext(context);
        logger.setPersistentLogAttributes({
          apiGatewayRequestId: event.requestContext.requestId,
        });
        logger.info('RAW EVENT', { event });
        const classContext = await createContext();
        const { user, originalUser } = await userFromEvent(event, classContext.users);
        classContext.user = user;
        classContext.originalUser = originalUser;
        classContext.lambdaEvent = event;
        classContext.lambdaContext = context;
        classContext.organization = await classContext.organizations.get(user.member.orgId) || undefined;
        return classContext;
      } catch(error) {
        logger.error('Error creating context', {error});
        throw error;
      }
    },
  }
);
