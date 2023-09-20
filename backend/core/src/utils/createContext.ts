import { Db } from "mongodb";
import mongodb from './mongo';

import { Organization, User } from "../__generated__/resolvers-types";
import { AssignmentModel } from "../models/assignment";
import { EventModel } from "../models/event";
import { MemberNotificationModel } from "../models/memberNotification";
import { MemberSkillModel } from "../models/memberSkill";
import { NotificationModel } from "../models/nontification";
import { OrganizationModel } from "../models/organization";
import { RankModel } from "../models/rank";
import { SchedulerModel } from "../models/scheduler";
import { ShiftModel } from "../models/shift";
import { ShiftBufferRequestModel } from "../models/shiftBufferRequest";
import { ShiftLotteryRequestModel } from "../models/shiftLotteryRequest";
import { SkillModel } from "../models/skill";
import { UserModel } from "../models/user";
import { VenueModel } from "../models/venue";
import { DocumentModel } from "../models/document";

let db: Db;

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
  shiftBufferRequests: ShiftBufferRequestModel;
  shiftLotteryRequests: ShiftLotteryRequestModel;
  memberNotifications: MemberNotificationModel;
  scheduler: SchedulerModel;
  organization?: Organization,
  user?: User;
  lambdaEvent?: any;
  lambdaContext?: any;
};

export const createContext = async (): Promise<Context> => {
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
  const shiftBufferRequests = new ShiftBufferRequestModel(db);
  const shiftLotteryRequests = new ShiftLotteryRequestModel(db);
  const events = new EventModel(db, document, shifts);
  const users = new UserModel(db, assignments, shifts, events, shiftBufferRequests, document);
  const memberSkills = new MemberSkillModel(db, users, document, skills);
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
    shiftBufferRequests,
    shiftLotteryRequests,
  };
};
