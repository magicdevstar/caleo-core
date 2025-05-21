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
import { Context, createContext, dbConnect } from '../../utils/createContext';
import { userFromEvent } from '../../utils/userFromEvent';
import { OperationModel } from '../../models/gqlOperations';

export const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
  introspection: process.env.STAGE !== 'prod',
  plugins: [
    {
      async requestDidStart(requestContext) {
        const db = await dbConnect();
        const gqlOperations = new OperationModel(db);
        gqlOperations.save(requestContext.request.operationName);
      },
    },
  ]
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
        const classContext: Context = await createContext() as unknown as Context;
        const { user, originalUser } = await userFromEvent(event, classContext.users);
        classContext.user = user;
        classContext.originalUser = originalUser;
        classContext.lambdaEvent = event;
        classContext.lambdaContext = context;
        classContext.organization = (await classContext.organizations.get(user.member.orgId))!;
        return classContext;
      } catch(error) {
        logger.error('Error creating context', {error});
        throw error;
      }
    },
  }
);
