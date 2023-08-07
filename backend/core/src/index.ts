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
import { SkillModel } from './models/skill';
import { MemberSkillModel } from './models/memberSkill';
import { VenueModel } from './models/venue';
import { NotificationModel } from './models/nontification';
import { MemberNotificationModel } from './models/memberNotification';

export interface Context {
  organizations: OrganizationModel;
  users: UserModel;
  ranks: RankModel;
  skills: SkillModel;
  memberSkills: MemberSkillModel;
  venues: VenueModel;
  notifications: NotificationModel;
  memberNotifications: MemberNotificationModel;
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
        skills: new SkillModel(db),
        memberSkills: new MemberSkillModel(db),
        venues: new VenueModel(db),
        notifications: new NotificationModel(db),
        memberNotifications: new MemberNotificationModel(db),
        user: event.requestContext?.authorizer?.lambda?.user,
        lambdaEvent: event,
        lambdaContext: context,
      };
    },
  }
);
