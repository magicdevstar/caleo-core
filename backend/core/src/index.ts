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
import { EventModel } from './models/event';
import { AssignmentModel } from './models/assignment';
import { ShiftModel } from './models/shift';
import { SchedulerModel } from './models/scheduler';
import { DocumentModel } from './models/document';

export interface Context {
  organizations: OrganizationModel;
  users: UserModel;
  ranks: RankModel;
  skills: SkillModel;
  memberSkills: MemberSkillModel;
  venues: VenueModel;
  notifications: NotificationModel;
  events: EventModel;
  assignments: AssignmentModel;
  shifts: ShiftModel;
  memberNotifications: MemberNotificationModel;
  scheduler: SchedulerModel;
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

      const organizations = new OrganizationModel(db);
      const document = new DocumentModel();
      const notifications = new NotificationModel(db);
      const scheduler = new SchedulerModel();
      const assignments = new AssignmentModel(db);
      const venues = new VenueModel(db);
      const shifts = new ShiftModel(db);
      const skills = new SkillModel(db);
      const ranks = new RankModel(db);
      const events = new EventModel(db, document, shifts);
      const users = new UserModel(db, assignments, shifts, events, organizations);
      const memberSkills = new MemberSkillModel(db, users, document);
      const memberNotifications = new MemberNotificationModel(db, notifications);

      return {
        organizations,
        users,
        ranks,
        skills,
        memberSkills,
        venues,
        events,
        assignments,
        shifts,
        notifications,
        memberNotifications,
        scheduler,
        user: event.requestContext?.authorizer?.lambda?.user,
        lambdaEvent: event,
        lambdaContext: context,
      };
    },
  }
);
