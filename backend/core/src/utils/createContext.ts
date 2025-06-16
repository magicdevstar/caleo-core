import { Db, MongoClient } from "mongodb";

import { AssignmentModel } from "../models/assignment";
import { EventModel } from "../models/event";
import { MemberNotificationModel } from "../models/memberNotification";
import { MemberSkillModel } from "../models/memberSkill";
import { NotificationModel } from "../models/nontification";
import { RankModel } from "../models/rank";
import { SchedulerModel } from "../models/scheduler";
import { ShiftModel } from "../models/shift";
import { ShiftBufferRequestModel } from "../models/shiftBufferRequest";
import { ShiftLotteryRequestModel } from "../models/shiftLotteryRequest";
import { SkillModel } from "../models/skill";
import { UserModel } from "../models/user";
import { VenueModel } from "../models/venue";
import { DocumentModel } from "../models/document";
import { EventReferenceNumber } from "../models/eventReferenceNumber";
import { LotteryCounterModel } from "../models/lotteryCounter";
import { SiteLockModel } from "../models/siteLock";
import { LotteryStateModel } from "../models/lotteryState";
import { BrowserNotificationSubscription } from "../models/browserNotificationSubscription";
import { InAppNotificationModel } from "../models/inAppNotifications";
import { UserAnalyticsModel } from "../models/analytics";
import { ShiftInterestRequestModel } from "../models/shiftInterestRequest";
import { IUser } from "../types/common";
import { EquipmentModel } from "../models/equipment";
import { MemberEquipmentModel } from "../models/memberEquipment";
import { UnitModel } from "../models/unit";
import { DivisionModel } from "../models/division";
import { DocusignModel } from "../models/docusign";
import { Docusign } from "../services/docusign.service";
import { DocusignEventModel } from "../models/docusignEvent";
import { InterestListService } from "../services/interestList.service";
import { OrganizationService } from "../models/organizations/organization.service";
import { OrganizationRepo } from "../models/organizations/organization.repository";
import { IOrganization } from "../models/organizations/organization.entity";
import { InvoiceService } from "../services/invoice.service";
import { VehicleCategoriesModel } from "../models/vehicleCategories";
import { NotificationService } from "../services/notification.service";
import { ChangeStreamService } from "../services/changeStream.service";
import { ChangesModel } from "../models/changes";
import { RankGroupRepo } from "../models/rankGroup/rankGroup.repository";
import { OutsideUserService } from "../models/outsideUsers/outsideUser.service";
import { OutsideUserRepo } from "../models/outsideUsers/outsideUser.repository";
import { IncidentSubmissionModel } from "../models/incidentForm";

let db: Db;

export const dbConnect = async (client?: MongoClient) => {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI!);
  }
  if (!db) {
    db = await client.db(process.env.MONGODB_NAME!);
  }
  return db;
};

export interface Context {
  db: Db;
  shiftInterestRequests: ShiftInterestRequestModel;
  analytics: UserAnalyticsModel;
  inAppNotifications: InAppNotificationModel;
  lotteryState: LotteryStateModel;
  docusign: Docusign;
  docusignModel: DocusignModel;
  siteLock: SiteLockModel;
  browserNotificationSubscriptions: BrowserNotificationSubscription;
  eventReferenceNumber: EventReferenceNumber;
  organizations: OrganizationService;
  lotteryCounter: LotteryCounterModel;
  users: UserModel;
  ranks: RankModel;
  unit: UnitModel;
  division: DivisionModel;
  skills: SkillModel;
  memberSkills: MemberSkillModel;
  equipments: EquipmentModel;
  memberEquipments: MemberEquipmentModel;
  venues: VenueModel;
  notifications: NotificationModel;
  events: EventModel;
  assignments: AssignmentModel;
  shifts: ShiftModel;
  shiftBufferRequests: ShiftBufferRequestModel;
  shiftLotteryRequests: ShiftLotteryRequestModel;
  memberNotifications: MemberNotificationModel;
  scheduler: SchedulerModel;
  interestList: InterestListService;
  invoiceService: InvoiceService;
  vehicleCategories: VehicleCategoriesModel;
  notificationService: NotificationService;
  changeStream: ChangeStreamService;
  incidentSubmissionModel: IncidentSubmissionModel;
  rankGroups: RankGroupRepo;
  outsideUsers: OutsideUserService;
  organization: IOrganization;
  user: IUser;
  originalUser?: IUser;
  lambdaEvent: any;
  lambdaContext: any;
};

export interface IServiceContext extends Omit<Context, 'user' | 'originalUser' | 'organization' | 'lambdaEvent' | 'lambdaContext' > {}

export const createContext = async (client?: MongoClient): Promise<IServiceContext> => {
  await dbConnect(client);

  const document = new DocumentModel();
  const scheduler = new SchedulerModel();
  const invoiceService = new InvoiceService();

  const orgRepo = new OrganizationRepo(db);
  const organizations = new OrganizationService(orgRepo, new SchedulerModel());

  const vehicleCategories = new VehicleCategoriesModel(db);
  const shiftInterestRequests = new ShiftInterestRequestModel(db);
  const lotteryState = new LotteryStateModel(db);
  const siteLock = new SiteLockModel(db);
  const lotteryCounter = new LotteryCounterModel(db, orgRepo);
  const eventReferenceNumber = new EventReferenceNumber(db);
  const notifications = new NotificationModel(db);
  const venues = new VenueModel(db);
  const shifts = new ShiftModel(db, lotteryCounter);
  const assignments = new AssignmentModel(db);
  const skills = new SkillModel(db);
  const ranks = new RankModel(db);
  const division = new DivisionModel(db);
  const unit = new UnitModel(db);
  const equipments = new EquipmentModel(db);
  const shiftBufferRequests = new ShiftBufferRequestModel(db);
  const shiftLotteryRequests = new ShiftLotteryRequestModel(db, lotteryCounter);
  const events = new EventModel(db, document, shifts);
  const users = new UserModel(
    db,
    assignments,
    shifts,
    events,
    shiftBufferRequests,
    document,
    lotteryCounter,
    shiftInterestRequests
  );
  const memberSkills = new MemberSkillModel(db, users, document, skills);
  const memberEquipments = new MemberEquipmentModel(db, users, document, equipments);
  const memberNotifications = new MemberNotificationModel(db);
  const browserNotificationSubscriptions = new BrowserNotificationSubscription(db);
  const inAppNotifications = new InAppNotificationModel(db);
  const analytics = new UserAnalyticsModel(db);
  const docusignModel = new DocusignModel(db, orgRepo);
  const docusignEventModel = new DocusignEventModel(db);
  const incidentSubmissionModel = new IncidentSubmissionModel(db);
  const outsideUserRepo = new OutsideUserRepo(db);
  const outsideUsers = new OutsideUserService(outsideUserRepo);
  const docusign = new Docusign(
    users,
    venues,
    events,
    ranks,
    unit,
    shifts,
    docusignModel,
    docusignEventModel,
    document,
    assignments,
    equipments,
    invoiceService,
    outsideUsers,
    incidentSubmissionModel,
  );
  const interestList = new InterestListService(
    shifts,
    shiftInterestRequests,
    events,
    scheduler,
  );

  const notificationService = new NotificationService(
    shifts
  );

  const rankGroups = new RankGroupRepo(db);

  const changesModel = new ChangesModel(db);
  const changeStream = new ChangeStreamService(
    events,
    assignments,
    notificationService,
    changesModel,
  );

  return {
    db,
    organizations,
    eventReferenceNumber,
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
    lotteryCounter,
    siteLock,
    lotteryState,
    browserNotificationSubscriptions,
    inAppNotifications,
    analytics,
    shiftInterestRequests,
    equipments,
    memberEquipments,
    division,
    unit,
    docusign,
    vehicleCategories,
    interestList,
    invoiceService,
    notificationService,
    changeStream,
    rankGroups,
    outsideUsers,
    docusignModel,
    incidentSubmissionModel,
  };
};
