import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
  ObjectId: { input: any; output: any; }
};

export type ActivityLog = {
  __typename?: 'ActivityLog';
  entries?: Maybe<Array<Maybe<ActivityLogEntry>>>;
};

export type ActivityLogEntry = {
  __typename?: 'ActivityLogEntry';
  missionNumber?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  time?: Maybe<Scalars['DateTime']['output']>;
};

export type AfterShiftRemove = {
  __typename?: 'AfterShiftRemove';
  days: Scalars['Int']['output'];
  tier: MemberTier;
};

export type AllUsersSearchInput = {
  admin?: InputMaybe<Scalars['Boolean']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  excludeIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orgIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  pNumber?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  queryField?: InputMaybe<Scalars['String']['input']>;
  rankIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  skillIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  statuses?: InputMaybe<Array<InputMaybe<MemberStatus>>>;
  tiers?: InputMaybe<Array<InputMaybe<MemberTier>>>;
};

export type Assignment = {
  __typename?: 'Assignment';
  availableShifts?: Maybe<Scalars['Int']['output']>;
  bwNeeded: Scalars['Boolean']['output'];
  callSign?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  docType: DocType;
  event: Event;
  eventId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isSigningAuthority?: Maybe<Scalars['Boolean']['output']>;
  lieutenant?: Maybe<User>;
  lieutenantAssignment?: Maybe<Assignment>;
  lieutenantAssignmentId?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use lieutenantAssignmentId instead! */
  lieutenantId?: Maybe<Scalars['String']['output']>;
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  notifyWhenFullyStaffed?: Maybe<Scalars['Boolean']['output']>;
  org: Organization;
  orgId: Scalars['String']['output'];
  rankIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  ranks?: Maybe<Array<Maybe<Rank>>>;
  removedAt?: Maybe<Scalars['String']['output']>;
  reportingLocation?: Maybe<Scalars['String']['output']>;
  requiredEquipment?: Maybe<Array<Maybe<Equipment>>>;
  requiredEquipmentIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  requiredSkillIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  requiredSkills?: Maybe<Array<Maybe<Skill>>>;
  shiftIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  shiftSlots?: Maybe<Array<Maybe<AssignmentShiftSlot>>>;
  shifts?: Maybe<Array<Maybe<Shift>>>;
  supervisor?: Maybe<User>;
  supervisorAssignment?: Maybe<Assignment>;
  supervisorAssignmentId?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use supervisorAssignmentId instead! */
  supervisorId?: Maybe<Scalars['String']['output']>;
  totalShifts?: Maybe<Scalars['Int']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type AssignmentSearchInput = {
  eventId?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type AssignmentSearchResult = {
  __typename?: 'AssignmentSearchResult';
  items?: Maybe<Array<Maybe<Assignment>>>;
  total: Scalars['Int']['output'];
};

export type AssignmentShiftSlot = {
  __typename?: 'AssignmentShiftSlot';
  id?: Maybe<Scalars['String']['output']>;
  slotCount?: Maybe<Scalars['Int']['output']>;
};

export type AssignmentSummary = {
  __typename?: 'AssignmentSummary';
  callSign?: Maybe<Scalars['String']['output']>;
  missionAssignments?: Maybe<MissionAssignments>;
  otherExplanation?: Maybe<Scalars['String']['output']>;
  squad?: Maybe<Scalars['String']['output']>;
  supervisor?: Maybe<Scalars['String']['output']>;
};

export type AvailabilityTime = {
  __typename?: 'AvailabilityTime';
  endTime: Scalars['String']['output'];
  startTime: Scalars['String']['output'];
};

export type AvailableShiftsSearchInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  upcoming?: InputMaybe<Scalars['Boolean']['input']>;
};

export type BrowserNotificationKeys = {
  __typename?: 'BrowserNotificationKeys';
  auth: Scalars['String']['output'];
  p256dh: Scalars['String']['output'];
};

export type BrowserNotificationSetting = {
  __typename?: 'BrowserNotificationSetting';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  org?: Maybe<Organization>;
  orgId: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  subscription: BrowserNotificationSubscription;
  updatedAt: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type BrowserNotificationSubscription = {
  __typename?: 'BrowserNotificationSubscription';
  endpoint: Scalars['String']['output'];
  expirationTime?: Maybe<Scalars['String']['output']>;
  keys: BrowserNotificationKeys;
};

export type CheckInOutCoordinates = {
  accuracy?: InputMaybe<Scalars['Float']['input']>;
  altitude?: InputMaybe<Scalars['Float']['input']>;
  altitudeAccuracy?: InputMaybe<Scalars['Float']['input']>;
  heading?: InputMaybe<Scalars['Float']['input']>;
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  speed?: InputMaybe<Scalars['Float']['input']>;
};

export type CheckInOutSetting = {
  __typename?: 'CheckInOutSetting';
  minutesAfterShiftEnd: Scalars['Int']['output'];
  minutesBeforeShiftStart: Scalars['Int']['output'];
};

export type ContactInfo = {
  __typename?: 'ContactInfo';
  primaryEmail: Email;
  primaryPhone?: Maybe<Phone>;
  secondaryEmail?: Maybe<Email>;
  secondaryPhone?: Maybe<Phone>;
};

export type CreateOrganization = {
  address?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contact?: InputMaybe<UpsertOrganizationContact>;
  customizations?: InputMaybe<UpsertOrganizationCustomizations>;
  features?: InputMaybe<UpsertOrganizationFeatures>;
  fromEmail?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  settings?: InputMaybe<UpsertOrganizationOvertimeSettings>;
  sso?: InputMaybe<UpsertOrganizationSsoSettings>;
  state?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  weekBegins?: InputMaybe<DayOfWeek>;
  zip?: InputMaybe<Scalars['String']['input']>;
};

export type CreateOutsideUser = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  pNumber: Scalars['String']['input'];
};

export type CreateShiftBufferRequest = {
  note?: InputMaybe<Scalars['String']['input']>;
  shiftBufferShiftId: Scalars['String']['input'];
  shiftId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type DayAvailability = {
  __typename?: 'DayAvailability';
  available: Scalars['Boolean']['output'];
  times?: Maybe<Array<AvailabilityTime>>;
};

export enum DayOfWeek {
  Friday = 'FRIDAY',
  Monday = 'MONDAY',
  Saturday = 'SATURDAY',
  Sunday = 'SUNDAY',
  Thursday = 'THURSDAY',
  Tuesday = 'TUESDAY',
  Wednesday = 'WEDNESDAY'
}

export type Division = {
  __typename?: 'Division';
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  docType: DocType;
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  org?: Maybe<Organization>;
  orgId: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type DivisionSearchInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type DivisionSearchResult = {
  __typename?: 'DivisionSearchResult';
  items?: Maybe<Array<Maybe<Division>>>;
  total: Scalars['Int']['output'];
};

export enum DocType {
  Assignment = 'ASSIGNMENT',
  BrowserNotificationSetting = 'BROWSER_NOTIFICATION_SETTING',
  Division = 'DIVISION',
  DsEvents = 'DS_EVENTS',
  DsToken = 'DS_TOKEN',
  Equipment = 'EQUIPMENT',
  Event = 'EVENT',
  IncidentForm = 'INCIDENT_FORM',
  InAppNotification = 'IN_APP_NOTIFICATION',
  LotteryCounter = 'LOTTERY_COUNTER',
  LotteryState = 'LOTTERY_STATE',
  MemberNotification = 'MEMBER_NOTIFICATION',
  MemberSkill = 'MEMBER_SKILL',
  Notification = 'NOTIFICATION',
  Organization = 'ORGANIZATION',
  OutsideUser = 'OUTSIDE_USER',
  Rank = 'RANK',
  RankGroup = 'RANK_GROUP',
  Shift = 'SHIFT',
  ShiftBufferRequest = 'SHIFT_BUFFER_REQUEST',
  ShiftInterestRequest = 'SHIFT_INTEREST_REQUEST',
  ShiftLotteryRequest = 'SHIFT_LOTTERY_REQUEST',
  SiteLock = 'SITE_LOCK',
  Skill = 'SKILL',
  Unit = 'UNIT',
  User = 'USER',
  UserAnalytics = 'USER_ANALYTICS',
  VehicleCategories = 'VEHICLE_CATEGORIES',
  Venue = 'VENUE'
}

export type DocusignEvent = {
  __typename?: 'DocusignEvent';
  assignmentId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  docType: DocType;
  documentUrl?: Maybe<Scalars['String']['output']>;
  documentUrls?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  envelopeId: Scalars['String']['output'];
  eventId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lieutenantId?: Maybe<Scalars['String']['output']>;
  orgId: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  shift?: Maybe<Shift>;
  shiftId?: Maybe<Scalars['String']['output']>;
  signerDetails?: Maybe<Array<DocusignSignerDetails>>;
  status: Scalars['String']['output'];
  supervisorId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type DocusignEventSearchInput = {
  eventIds?: InputMaybe<Array<Scalars['String']['input']>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<DocusignEventUserRole>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  userId: Scalars['String']['input'];
};

export type DocusignEventSearchResult = {
  __typename?: 'DocusignEventSearchResult';
  items?: Maybe<Array<Maybe<DocusignEvent>>>;
  total: Scalars['Int']['output'];
};

export enum DocusignEventUserRole {
  Lieutenant = 'LIEUTENANT',
  Officer = 'OFFICER',
  Supervisor = 'SUPERVISOR'
}

export type DocusignSettings = {
  __typename?: 'DocusignSettings';
  templateId?: Maybe<Scalars['String']['output']>;
};

export type DocusignSignerDetails = {
  __typename?: 'DocusignSignerDetails';
  data?: Maybe<DocusignSignerDetailsData>;
  email: Scalars['String']['output'];
  roleName: Scalars['String']['output'];
  routingOrder: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type DocusignSignerDetailsData = {
  __typename?: 'DocusignSignerDetailsData';
  callSign?: Maybe<Scalars['String']['output']>;
  endingMilage?: Maybe<Scalars['String']['output']>;
  officerShiftTimeIn?: Maybe<Scalars['String']['output']>;
  officerShiftTimeOut?: Maybe<Scalars['String']['output']>;
  startingMilage?: Maybe<Scalars['String']['output']>;
  totalMilage?: Maybe<Scalars['String']['output']>;
  vehicleMake?: Maybe<Scalars['String']['output']>;
  vehicleModel?: Maybe<Scalars['String']['output']>;
  vehicleNumber?: Maybe<Scalars['String']['output']>;
};

export type Email = {
  __typename?: 'Email';
  address: Scalars['String']['output'];
  receiveEmails: Scalars['Boolean']['output'];
};

export type Equipment = {
  __typename?: 'Equipment';
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  docType: DocType;
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  org: Organization;
  orgId: Scalars['String']['output'];
  rankOnlyIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  ranksOnly?: Maybe<Array<Maybe<Rank>>>;
  removedAt?: Maybe<Scalars['String']['output']>;
  requiresAdminApproval: Scalars['Boolean']['output'];
  requiresCert: Scalars['Boolean']['output'];
  requiresEquipmentTime: Scalars['Boolean']['output'];
  requiresVehicleInformation: Scalars['Boolean']['output'];
  updatedAt: Scalars['String']['output'];
};

export type EquipmentSearchInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  rankOnlyIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  requiresAdminApproval?: InputMaybe<Scalars['Boolean']['input']>;
  requiresCert?: InputMaybe<Scalars['Boolean']['input']>;
  requiresEquipmentTime?: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type EquipmentSearchResult = {
  __typename?: 'EquipmentSearchResult';
  items?: Maybe<Array<Maybe<Equipment>>>;
  total: Scalars['Int']['output'];
};

export enum EquipmentStatus {
  Approved = 'APPROVED',
  Denied = 'DENIED',
  Pending = 'PENDING'
}

export type Event = {
  __typename?: 'Event';
  assignmentIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  assignments?: Maybe<Array<Assignment>>;
  attachmentPaths?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  attachments?: Maybe<Array<Scalars['String']['output']>>;
  autoAssignInterestList?: Maybe<Scalars['Boolean']['output']>;
  availableShifts?: Maybe<Scalars['Int']['output']>;
  budgetActivityCode?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use the assignments callSign instead! */
  callSign?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  createdBy?: Maybe<User>;
  createdById?: Maybe<Scalars['String']['output']>;
  docType: DocType;
  docusignEnvelopeId?: Maybe<Scalars['String']['output']>;
  docusignEnvelopeStatus?: Maybe<Scalars['String']['output']>;
  docusignEvent?: Maybe<DocusignEvent>;
  endTime?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  interestListAutoAssignCutoff?: Maybe<Scalars['String']['output']>;
  interestListTransition?: Maybe<EventStatus>;
  lieutenant?: Maybe<User>;
  lieutenantId?: Maybe<Scalars['String']['output']>;
  lotteryCounter?: Maybe<LotteryCounter>;
  lotteryNumber?: Maybe<Scalars['Int']['output']>;
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  notifyOnFirstComeFirstServe?: Maybe<Scalars['Boolean']['output']>;
  notifyWhenFullyStaffed?: Maybe<Scalars['Boolean']['output']>;
  ocn?: Maybe<Scalars['String']['output']>;
  org: Organization;
  orgId: Scalars['String']['output'];
  outsideOrgCode?: Maybe<Scalars['String']['output']>;
  overtimeReasonCode?: Maybe<Scalars['String']['output']>;
  referenceId: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  requestDetails?: Maybe<EventRequestDetails>;
  requiredSkillIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  requiredSkills?: Maybe<Array<Maybe<Skill>>>;
  scheduledCloseInterestList?: Maybe<Scalars['String']['output']>;
  scheduledFirstComeFirstServe?: Maybe<Scalars['String']['output']>;
  scheduledInterestList?: Maybe<Scalars['String']['output']>;
  searchAttribute: Scalars['String']['output'];
  startTime?: Maybe<Scalars['String']['output']>;
  status: EventStatus;
  supervisor?: Maybe<User>;
  supervisorId?: Maybe<Scalars['String']['output']>;
  totalShifts?: Maybe<Scalars['Int']['output']>;
  updatedAt: Scalars['String']['output'];
  venue?: Maybe<Venue>;
  venueId?: Maybe<Scalars['String']['output']>;
};

export type EventAttachmentUpload = {
  __typename?: 'EventAttachmentUpload';
  attachmentPath: Scalars['String']['output'];
  uploadUrl: Scalars['String']['output'];
};

export type EventInvoiceResponse = {
  __typename?: 'EventInvoiceResponse';
  signingUrl: Scalars['String']['output'];
};

export type EventRequestDetails = {
  __typename?: 'EventRequestDetails';
  adminNote?: Maybe<Scalars['String']['output']>;
  endTime?: Maybe<Scalars['String']['output']>;
  estimatedAttendees?: Maybe<Scalars['Int']['output']>;
  newVenue?: Maybe<Scalars['Boolean']['output']>;
  numberOfOfficers?: Maybe<Scalars['Int']['output']>;
  requestorEmail?: Maybe<Scalars['String']['output']>;
  startTime?: Maybe<Scalars['String']['output']>;
};

export type EventSearchInput = {
  createdById?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  endTime?: InputMaybe<SearchTimeFilter>;
  includeRemoved?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  lotteryNumber?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  range?: InputMaybe<SearchTimeRange>;
  referenceIds?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Array<InputMaybe<EventStatus>>>;
  venueIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type EventSearchResult = {
  __typename?: 'EventSearchResult';
  items?: Maybe<Array<Maybe<Event>>>;
  total: Scalars['Int']['output'];
};

export enum EventStatus {
  Complete = 'COMPLETE',
  Draft = 'DRAFT',
  FirstComeFirstServe = 'FIRST_COME_FIRST_SERVE',
  Incident = 'INCIDENT',
  InterestList = 'INTEREST_LIST',
  PreFirstComeFirstServe = 'PRE_FIRST_COME_FIRST_SERVE',
  PreLottery = 'PRE_LOTTERY',
  ReadyForLottery = 'READY_FOR_LOTTERY',
  Removed = 'REMOVED',
  Requested = 'REQUESTED',
  Template = 'TEMPLATE'
}

export type FinanceShift = {
  __typename?: 'FinanceShift';
  division?: Maybe<Division>;
  docusignEvent?: Maybe<DocusignEvent>;
  endTime: Scalars['DateTime']['output'];
  rank?: Maybe<Rank>;
  startTime: Scalars['DateTime']['output'];
  totalOvertimeHours: Scalars['Float']['output'];
  totalStraightHours: Scalars['Float']['output'];
  totalVehicleMilage: Scalars['Float']['output'];
  unit?: Maybe<Unit>;
  user: User;
  vehicleCategory?: Maybe<VehicleCategories>;
};

export type FinanceShiftSearchInput = {
  eventId: Scalars['ObjectId']['input'];
};

export type IActivityLog = {
  entries?: InputMaybe<Array<InputMaybe<IActivityLogEntry>>>;
};

export type IActivityLogEntry = {
  missionNumber?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  time?: InputMaybe<Scalars['DateTime']['input']>;
};

export type IAssignmentSummary = {
  callSign?: InputMaybe<Scalars['String']['input']>;
  missionAssignments?: InputMaybe<IMissionAssignments>;
  otherExplanation?: InputMaybe<Scalars['String']['input']>;
  squad?: InputMaybe<Scalars['String']['input']>;
  supervisor?: InputMaybe<Scalars['String']['input']>;
};

export type IIncidentForm = {
  activityLog: IActivityLog;
  assignmentSummary: IAssignmentSummary;
  eventId: Scalars['ObjectId']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
  operationalPeriod: IOperationalPeriod;
  reviewer: Scalars['ObjectId']['input'];
  shiftDetails: IShiftDetails;
  step?: InputMaybe<Scalars['Int']['input']>;
  timekeeping: ITimekeeping;
  vehicleInformation: IVehicleInformation;
};

export type IMissionAssignments = {
  escort?: InputMaybe<Scalars['Boolean']['input']>;
  evacuations?: InputMaybe<Scalars['Boolean']['input']>;
  hardClosure?: InputMaybe<Scalars['Boolean']['input']>;
  incidentManagementTeam?: InputMaybe<Scalars['Boolean']['input']>;
  logistics?: InputMaybe<Scalars['Boolean']['input']>;
  other?: InputMaybe<Scalars['Boolean']['input']>;
  rovingSecurity?: InputMaybe<Scalars['Boolean']['input']>;
  rrf?: InputMaybe<Scalars['Boolean']['input']>;
  searchAndRescue?: InputMaybe<Scalars['Boolean']['input']>;
  softClosure?: InputMaybe<Scalars['Boolean']['input']>;
  welfareCheck?: InputMaybe<Scalars['Boolean']['input']>;
};

export type IOperationalPeriod = {
  date: Scalars['Date']['input'];
};

export type IShiftDetails = {
  arrivalAtUOA?: InputMaybe<Scalars['DateTime']['input']>;
  enrouteToIncident?: InputMaybe<Scalars['DateTime']['input']>;
  staging1097?: InputMaybe<Scalars['DateTime']['input']>;
  staging1098?: InputMaybe<Scalars['DateTime']['input']>;
  time18Hour?: InputMaybe<Scalars['DateTime']['input']>;
};

export type ITimekeeping = {
  overtimeHours?: InputMaybe<Scalars['Float']['input']>;
  overtimeTimeIn?: InputMaybe<Scalars['DateTime']['input']>;
  overtimeTimeOut?: InputMaybe<Scalars['DateTime']['input']>;
  rdo?: InputMaybe<Scalars['String']['input']>;
  straightHours?: InputMaybe<Scalars['Float']['input']>;
  timeIn?: InputMaybe<Scalars['DateTime']['input']>;
  timeOut?: InputMaybe<Scalars['DateTime']['input']>;
  type?: InputMaybe<TimekeepingType>;
};

export type IVehicleInformation = {
  endingMileage?: InputMaybe<Scalars['Float']['input']>;
  hasVehicle?: InputMaybe<Scalars['String']['input']>;
  startingMileage?: InputMaybe<Scalars['Float']['input']>;
  vehicleCategory?: InputMaybe<Scalars['ObjectId']['input']>;
  vehicleMake?: InputMaybe<Scalars['String']['input']>;
  vehicleModel?: InputMaybe<Scalars['String']['input']>;
  vehicleNumber?: InputMaybe<Scalars['String']['input']>;
};

export type InAppNotificationMeta = {
  __typename?: 'InAppNotificationMeta';
  assignmentId?: Maybe<Scalars['String']['output']>;
  eventId?: Maybe<Scalars['String']['output']>;
  rankId?: Maybe<Scalars['String']['output']>;
  shiftBufferRequestId?: Maybe<Scalars['String']['output']>;
  shiftId?: Maybe<Scalars['String']['output']>;
  skillId?: Maybe<Scalars['String']['output']>;
  venueId?: Maybe<Scalars['String']['output']>;
};

export type InAppNotificationSearchInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  read?: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type InAppNotificationSearchResult = {
  __typename?: 'InAppNotificationSearchResult';
  items?: Maybe<Array<Maybe<InAppNotifications>>>;
  total: Scalars['Int']['output'];
  unreadCount: Scalars['Int']['output'];
};

export type InAppNotifications = {
  __typename?: 'InAppNotifications';
  body: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  docType: DocType;
  id: Scalars['ID']['output'];
  meta?: Maybe<InAppNotificationMeta>;
  org: Organization;
  orgId: Scalars['String']['output'];
  read: Scalars['Boolean']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  templateName: Scalars['String']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
  user: User;
  userId: Scalars['String']['output'];
};

export type IncidentForm = {
  __typename?: 'IncidentForm';
  activityLog: ActivityLog;
  assignmentSummary: AssignmentSummary;
  createdAt: Scalars['String']['output'];
  docusignEvent?: Maybe<DocusignEvent>;
  envelopeId?: Maybe<Scalars['String']['output']>;
  event: Event;
  eventId: Scalars['ObjectId']['output'];
  id: Scalars['ID']['output'];
  modifiedBy: User;
  modifiedById: Scalars['ObjectId']['output'];
  operationalPeriod: OperationalPeriod;
  org: Organization;
  orgId: Scalars['ObjectId']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  reviewer: Scalars['ObjectId']['output'];
  reviewerUser?: Maybe<OutsideUser>;
  shiftDetails: ShiftDetails;
  status?: Maybe<IncidentFormStatus>;
  step?: Maybe<Scalars['Int']['output']>;
  submittedDate?: Maybe<Scalars['DateTime']['output']>;
  timekeeping: Timekeeping;
  updatedAt: Scalars['String']['output'];
  user: User;
  userId: Scalars['ObjectId']['output'];
  vehicleInformation: VehicleInformation;
};

export type IncidentFormResponse = {
  __typename?: 'IncidentFormResponse';
  incidentForm: IncidentForm;
  signingUrl?: Maybe<Scalars['String']['output']>;
};

export type IncidentFormSearchInput = {
  eventId: Scalars['ObjectId']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<IncidentFormStatus>;
  submittedDate?: InputMaybe<SearchDateFilter>;
  userId?: InputMaybe<Scalars['ObjectId']['input']>;
};

export type IncidentFormSearchResult = {
  __typename?: 'IncidentFormSearchResult';
  items?: Maybe<Array<IncidentForm>>;
  total: Scalars['Int']['output'];
};

export enum IncidentFormStatus {
  Draft = 'DRAFT',
  Submitted = 'SUBMITTED'
}

export type InputAdminResetPassword = {
  password: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type InputAvailabilityTime = {
  endTime: Scalars['String']['input'];
  startTime: Scalars['String']['input'];
};

export type InputBrowserNotificationKeys = {
  auth: Scalars['String']['input'];
  p256dh: Scalars['String']['input'];
};

export type InputBrowserNotificationSubscription = {
  endpoint: Scalars['String']['input'];
  expirationTime?: InputMaybe<Scalars['String']['input']>;
  keys: InputBrowserNotificationKeys;
};

export type InputDayAvailability = {
  available: Scalars['Boolean']['input'];
  times?: InputMaybe<Array<InputAvailabilityTime>>;
};

export type InputEventRequestDetails = {
  adminNote?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  estimatedAttendees?: InputMaybe<Scalars['Int']['input']>;
  newVenue?: InputMaybe<Scalars['Boolean']['input']>;
  numberOfOfficers?: InputMaybe<Scalars['Int']['input']>;
  requestorEmail?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
};

export type InputUserAvailability = {
  friday: InputDayAvailability;
  monday: InputDayAvailability;
  saturday: InputDayAvailability;
  sunday: InputDayAvailability;
  thursday: InputDayAvailability;
  tuesday: InputDayAvailability;
  wednesday: InputDayAvailability;
};

export type InterestListSetting = {
  __typename?: 'InterestListSetting';
  defaultAutoHireCutoff?: Maybe<Scalars['Int']['output']>;
  defaultHoursBeforeShift?: Maybe<Scalars['Int']['output']>;
  defaultNotificationTime?: Maybe<Scalars['Int']['output']>;
};

export type InviteMember = {
  divisionId?: InputMaybe<Scalars['String']['input']>;
  pNumber?: InputMaybe<Scalars['String']['input']>;
  rankId?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<MemberRole>;
  tenor?: InputMaybe<Scalars['String']['input']>;
  tier?: InputMaybe<MemberTier>;
  unitId?: InputMaybe<Scalars['String']['input']>;
};

export type InviteUser = {
  email: Scalars['String']['input'];
  member: InviteMember;
  orgId: Scalars['String']['input'];
};

export type LotteryCounter = {
  __typename?: 'LotteryCounter';
  counter: Scalars['Int']['output'];
  createdAt: Scalars['String']['output'];
  docType: DocType;
  end: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  org: Organization;
  orgId: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  start: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type LotteryCounterSearchResult = {
  __typename?: 'LotteryCounterSearchResult';
  items?: Maybe<Array<Maybe<LotteryCounter>>>;
  total: Scalars['Int']['output'];
};

export type LotteryDate = {
  __typename?: 'LotteryDate';
  dayOfWeek: DayOfWeek;
  time: Scalars['String']['output'];
};

export type LotterySettings = {
  __typename?: 'LotterySettings';
  close: LotteryDate;
  enabled: Scalars['Boolean']['output'];
  fcfsShiftsDelay: Scalars['Int']['output'];
  notifyUsersBeforeClose: Scalars['Int']['output'];
  open: LotteryDate;
};

export type LottoAnalytics = {
  __typename?: 'LottoAnalytics';
  approved: Scalars['Int']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lotteryCounter: Scalars['Int']['output'];
  org?: Maybe<Organization>;
  rejected: Scalars['Int']['output'];
  requests?: Maybe<Array<Maybe<LottoRequests>>>;
  total: Scalars['Int']['output'];
  totalShifts: Scalars['Int']['output'];
  totalUnassignedShifts?: Maybe<Scalars['Int']['output']>;
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export type LottoRequests = {
  __typename?: 'LottoRequests';
  assignment?: Maybe<Assignment>;
  assignmentId: Scalars['String']['output'];
  event?: Maybe<Event>;
  eventId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  order: Scalars['Int']['output'];
  shiftGroupId: Scalars['String']['output'];
  status: ShiftLotteryRequestStatus;
  totalRequests: Scalars['Int']['output'];
};

export type Member = {
  __typename?: 'Member';
  adminNote?: Maybe<Scalars['String']['output']>;
  availability: UserAvailability;
  contactInfo?: Maybe<ContactInfo>;
  deactivationNote?: Maybe<Scalars['String']['output']>;
  division?: Maybe<Division>;
  divisionId?: Maybe<Scalars['String']['output']>;
  hourlyRate?: Maybe<Scalars['Float']['output']>;
  inactivateUntil?: Maybe<Scalars['String']['output']>;
  inactivationNote?: Maybe<Scalars['String']['output']>;
  incidentHourlyRate?: Maybe<Scalars['Float']['output']>;
  maxShifts?: Maybe<Scalars['Int']['output']>;
  memberEquipmentIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  memberEquipments?: Maybe<Array<Maybe<MemberEquipment>>>;
  memberSkillIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  memberSkills?: Maybe<Array<Maybe<MemberSkill>>>;
  org?: Maybe<Organization>;
  orgId: Scalars['String']['output'];
  pNumber: Scalars['String']['output'];
  rank?: Maybe<Rank>;
  rankId?: Maybe<Scalars['String']['output']>;
  role?: Maybe<MemberRole>;
  startDate?: Maybe<Scalars['String']['output']>;
  status?: Maybe<MemberStatus>;
  tenor?: Maybe<Scalars['String']['output']>;
  tier?: Maybe<MemberTier>;
  tierResetOnNextLottery?: Maybe<Scalars['Boolean']['output']>;
  tierUntil?: Maybe<Scalars['String']['output']>;
  unit?: Maybe<Unit>;
  unitId?: Maybe<Scalars['String']['output']>;
};

export type MemberEquipment = {
  __typename?: 'MemberEquipment';
  createdAt: Scalars['String']['output'];
  docType: DocType;
  equipment: Equipment;
  equipmentId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  image?: Maybe<Scalars['String']['output']>;
  imagePath: Scalars['String']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  orgId: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  status: EquipmentStatus;
  statusReason?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export type MemberEquipmentAttachmentUpload = {
  __typename?: 'MemberEquipmentAttachmentUpload';
  imagePath: Scalars['String']['output'];
  uploadUrl: Scalars['String']['output'];
};

export type MemberEquipmentSearchInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type MemberEquipmentSearchResult = {
  __typename?: 'MemberEquipmentSearchResult';
  items?: Maybe<Array<Maybe<MemberEquipment>>>;
  total: Scalars['Int']['output'];
};

export type MemberNotification = {
  __typename?: 'MemberNotification';
  docType: DocType;
  id: Scalars['ID']['output'];
  lastSeen: Scalars['String']['output'];
  notification: Notification;
  notificationId: Scalars['String']['output'];
  user: User;
  userId: Scalars['String']['output'];
};

export enum MemberRole {
  Admin = 'ADMIN',
  Member = 'MEMBER'
}

export type MemberSkill = {
  __typename?: 'MemberSkill';
  createdAt: Scalars['String']['output'];
  docType: DocType;
  id: Scalars['ID']['output'];
  image?: Maybe<Scalars['String']['output']>;
  imagePath: Scalars['String']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  orgId: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  skill: Skill;
  skillId: Scalars['String']['output'];
  status: SkillStatus;
  statusReason?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export type MemberSkillAttachmentUpload = {
  __typename?: 'MemberSkillAttachmentUpload';
  imagePath: Scalars['String']['output'];
  uploadUrl: Scalars['String']['output'];
};

export type MemberSkillSearchInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type MemberSkillSearchResult = {
  __typename?: 'MemberSkillSearchResult';
  items?: Maybe<Array<Maybe<MemberSkill>>>;
  total: Scalars['Int']['output'];
};

export enum MemberStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Invited = 'INVITED',
  Pending = 'PENDING',
  Removed = 'REMOVED'
}

export enum MemberTier {
  Tier_1 = 'TIER_1',
  Tier_2 = 'TIER_2',
  Tier_3 = 'TIER_3',
  Tier_4 = 'TIER_4'
}

export type MissionAssignments = {
  __typename?: 'MissionAssignments';
  escort?: Maybe<Scalars['Boolean']['output']>;
  evacuations?: Maybe<Scalars['Boolean']['output']>;
  hardClosure?: Maybe<Scalars['Boolean']['output']>;
  incidentManagementTeam?: Maybe<Scalars['Boolean']['output']>;
  logistics?: Maybe<Scalars['Boolean']['output']>;
  other?: Maybe<Scalars['Boolean']['output']>;
  rovingSecurity?: Maybe<Scalars['Boolean']['output']>;
  rrf?: Maybe<Scalars['Boolean']['output']>;
  searchAndRescue?: Maybe<Scalars['Boolean']['output']>;
  softClosure?: Maybe<Scalars['Boolean']['output']>;
  welfareCheck?: Maybe<Scalars['Boolean']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addRanksToGroup?: Maybe<Scalars['Boolean']['output']>;
  adminEditPassword?: Maybe<Scalars['Boolean']['output']>;
  approveEvent?: Maybe<Event>;
  approveLottoAssignment?: Maybe<Scalars['Boolean']['output']>;
  assignment?: Maybe<Assignment>;
  browserNotificationSubscription?: Maybe<BrowserNotificationSetting>;
  checkIn: Shift;
  checkOut: ShiftCheckOutResponse;
  cloneEvent?: Maybe<Event>;
  createOrganization?: Maybe<Organization>;
  division?: Maybe<Division>;
  editCheckInOut: Shift;
  equipment?: Maybe<Equipment>;
  event?: Maybe<Event>;
  eventAttachmentUploadUrl?: Maybe<EventAttachmentUpload>;
  generateDSInvoice?: Maybe<EventInvoiceResponse>;
  generateInvoice?: Maybe<Scalars['String']['output']>;
  impersonateUser?: Maybe<Scalars['Boolean']['output']>;
  incidentForm: IncidentFormResponse;
  inviteUser?: Maybe<User>;
  newUser?: Maybe<User>;
  notification?: Maybe<Notification>;
  notifyUsersOfEvent?: Maybe<Scalars['Boolean']['output']>;
  notifyUsersOfShift?: Maybe<Scalars['Boolean']['output']>;
  organization?: Maybe<Organization>;
  outsideUsers: Array<OutsideUser>;
  partialShiftUpdate?: Maybe<Scalars['String']['output']>;
  profilePhotoUploadUrl?: Maybe<ProfilePhotoAttachmentUpload>;
  rank?: Maybe<Rank>;
  rankGroup?: Maybe<RankGroup>;
  readInAppNotifications?: Maybe<Scalars['Boolean']['output']>;
  rejectEvent?: Maybe<Event>;
  rejectLottoAssignment?: Maybe<Scalars['Boolean']['output']>;
  removeAssignment: Scalars['ID']['output'];
  removeBrowserNotificationSubscription?: Maybe<Scalars['Boolean']['output']>;
  removeDivision: Scalars['ID']['output'];
  removeEquipment: Scalars['ID']['output'];
  removeEvent: Scalars['ID']['output'];
  removeInAppNotifications?: Maybe<Scalars['Boolean']['output']>;
  removeIncidentForm: Scalars['ID']['output'];
  removeNotification: Scalars['ID']['output'];
  removeOutsideUser: Scalars['ID']['output'];
  removeRank: Scalars['ID']['output'];
  removeRankGroup: Scalars['ID']['output'];
  removeRanksFromGroup?: Maybe<Scalars['Boolean']['output']>;
  removeShift: Scalars['ID']['output'];
  removeShiftBufferRequest: Scalars['ID']['output'];
  removeShiftInterestRequest: Scalars['ID']['output'];
  removeShiftLotteryRequest: Scalars['ID']['output'];
  removeShifts: Array<Maybe<Scalars['String']['output']>>;
  removeSkill: Scalars['ID']['output'];
  removeUnit: Scalars['ID']['output'];
  removeUser: Scalars['ID']['output'];
  removeUserEquipment: Scalars['ID']['output'];
  removeUserSkill: Scalars['ID']['output'];
  removeVehicleCategory: Scalars['ID']['output'];
  removeVenue: Scalars['ID']['output'];
  resetImpersonation?: Maybe<Scalars['Boolean']['output']>;
  seenNotifications?: Maybe<Scalars['Boolean']['output']>;
  setShiftBufferStatus?: Maybe<ShiftBufferRequest>;
  shiftAssign?: Maybe<Shift>;
  shiftBufferRequest?: Maybe<ShiftBufferRequest>;
  shiftInterestRequest?: Maybe<ShiftInterestRequest>;
  shiftLotteryRequest?: Maybe<ShiftLotteryRequest>;
  shifts?: Maybe<Array<Maybe<Shift>>>;
  siteLock?: Maybe<SiteLock>;
  skill?: Maybe<Skill>;
  templateEvent?: Maybe<Event>;
  unit?: Maybe<Unit>;
  user?: Maybe<User>;
  userEquipment?: Maybe<MemberEquipment>;
  userEquipmentAttachmentUploadUrl?: Maybe<MemberEquipmentAttachmentUpload>;
  userSkill?: Maybe<MemberSkill>;
  userSkillAttachmentUploadUrl?: Maybe<MemberSkillAttachmentUpload>;
  vehicleCategory?: Maybe<VehicleCategories>;
  venue?: Maybe<Venue>;
};


export type MutationAddRanksToGroupArgs = {
  rankGroupId: Scalars['String']['input'];
  rankIds: Array<Scalars['String']['input']>;
};


export type MutationAdminEditPasswordArgs = {
  input: InputAdminResetPassword;
};


export type MutationApproveEventArgs = {
  id: Scalars['String']['input'];
};


export type MutationApproveLottoAssignmentArgs = {
  id: Scalars['String']['input'];
  shiftId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type MutationAssignmentArgs = {
  assignment: UpsertAssignment;
};


export type MutationBrowserNotificationSubscriptionArgs = {
  input: InputBrowserNotificationSubscription;
};


export type MutationCheckInArgs = {
  input: ShiftCheckInOutEvent;
};


export type MutationCheckOutArgs = {
  input: ShiftCheckInOutEvent;
};


export type MutationCloneEventArgs = {
  id: Scalars['String']['input'];
};


export type MutationCreateOrganizationArgs = {
  organization: CreateOrganization;
};


export type MutationDivisionArgs = {
  division: UpsertDivision;
};


export type MutationEditCheckInOutArgs = {
  input: ShiftAdminCheckInOutEvent;
};


export type MutationEquipmentArgs = {
  equipment: UpsertEquipment;
};


export type MutationEventArgs = {
  event: UpsertEvent;
};


export type MutationGenerateDsInvoiceArgs = {
  eventId: Scalars['String']['input'];
};


export type MutationGenerateInvoiceArgs = {
  eventId: Scalars['String']['input'];
};


export type MutationImpersonateUserArgs = {
  userId: Scalars['String']['input'];
};


export type MutationIncidentFormArgs = {
  input: IIncidentForm;
  saveOnly?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationInviteUserArgs = {
  user: InviteUser;
};


export type MutationNewUserArgs = {
  user: NewUser;
};


export type MutationNotificationArgs = {
  notification: UpsertNotification;
};


export type MutationNotifyUsersOfEventArgs = {
  eventId: Scalars['String']['input'];
};


export type MutationNotifyUsersOfShiftArgs = {
  shiftId: Scalars['String']['input'];
};


export type MutationOrganizationArgs = {
  organization: UpsertOrganization;
};


export type MutationOutsideUsersArgs = {
  users: Array<CreateOutsideUser>;
};


export type MutationPartialShiftUpdateArgs = {
  shiftId: Scalars['String']['input'];
  updates: ShiftUpdates;
};


export type MutationRankArgs = {
  rank: UpsertRank;
};


export type MutationRankGroupArgs = {
  rankGroup: UpsertRankGroup;
};


export type MutationReadInAppNotificationsArgs = {
  ids?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  readAll?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationRejectEventArgs = {
  id: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRejectLottoAssignmentArgs = {
  id: Scalars['String']['input'];
  shiftId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type MutationRemoveAssignmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveBrowserNotificationSubscriptionArgs = {
  endpoint?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRemoveDivisionArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveEquipmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveEventArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveInAppNotificationsArgs = {
  ids?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  removeAll?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationRemoveIncidentFormArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveNotificationArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveOutsideUserArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveRankArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveRankGroupArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveRanksFromGroupArgs = {
  rankGroupId: Scalars['String']['input'];
  rankIds: Array<Scalars['String']['input']>;
};


export type MutationRemoveShiftArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveShiftBufferRequestArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveShiftInterestRequestArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRemoveShiftLotteryRequestArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRemoveShiftsArgs = {
  shiftId: Scalars['String']['input'];
};


export type MutationRemoveSkillArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveUnitArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveUserArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveUserEquipmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveUserSkillArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveVehicleCategoryArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveVenueArgs = {
  id: Scalars['String']['input'];
};


export type MutationSeenNotificationsArgs = {
  notificationIds: Array<InputMaybe<Scalars['String']['input']>>;
};


export type MutationSetShiftBufferStatusArgs = {
  id: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  status: ShiftBufferRequestStatus;
};


export type MutationShiftAssignArgs = {
  id: Scalars['String']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationShiftBufferRequestArgs = {
  shiftBufferRequest?: InputMaybe<CreateShiftBufferRequest>;
};


export type MutationShiftInterestRequestArgs = {
  shiftInterestRequest?: InputMaybe<UpsertShiftInterestRequest>;
};


export type MutationShiftLotteryRequestArgs = {
  shiftLotteryRequest?: InputMaybe<UpsertShiftLotteryRequest>;
};


export type MutationShiftsArgs = {
  removeSlots?: InputMaybe<Scalars['Boolean']['input']>;
  shifts: Array<InputMaybe<UpsertShift>>;
};


export type MutationSiteLockArgs = {
  input?: InputMaybe<UpsertSiteLock>;
};


export type MutationSkillArgs = {
  skill: UpsertSkill;
};


export type MutationTemplateEventArgs = {
  id: Scalars['String']['input'];
};


export type MutationUnitArgs = {
  unit: UpsertUnit;
};


export type MutationUserArgs = {
  user: UpdateUser;
};


export type MutationUserEquipmentArgs = {
  userEquipment: UpsertMemberEquipment;
};


export type MutationUserSkillArgs = {
  userSkill: UpsertMemberSkill;
};


export type MutationVehicleCategoryArgs = {
  vehicleCategory: UpsertVehicleCategories;
};


export type MutationVenueArgs = {
  venue: UpsertVenue;
};

export type NewContactInfo = {
  primaryEmail: NewEmail;
  primaryPhone?: InputMaybe<NewPhone>;
  secondaryEmail?: InputMaybe<NewEmail>;
  secondaryPhone?: InputMaybe<NewPhone>;
};

export type NewEmail = {
  address: Scalars['String']['input'];
  receiveEmails: Scalars['Boolean']['input'];
};

export type NewMember = {
  adminNote?: InputMaybe<Scalars['String']['input']>;
  availability?: InputMaybe<InputUserAvailability>;
  contactInfo?: InputMaybe<NewContactInfo>;
  deactivationNote?: InputMaybe<Scalars['String']['input']>;
  divisionId?: InputMaybe<Scalars['String']['input']>;
  hourlyRate?: InputMaybe<Scalars['Float']['input']>;
  inactivateUntil?: InputMaybe<Scalars['String']['input']>;
  inactivationNote?: InputMaybe<Scalars['String']['input']>;
  incidentHourlyRate?: InputMaybe<Scalars['Float']['input']>;
  maxShifts?: InputMaybe<Scalars['Int']['input']>;
  memberEquipmentIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  memberSkillIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  orgId: Scalars['String']['input'];
  pNumber: Scalars['String']['input'];
  rankId?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<MemberRole>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<MemberStatus>;
  tenor?: InputMaybe<Scalars['String']['input']>;
  tier?: InputMaybe<MemberTier>;
  tierUntil?: InputMaybe<Scalars['String']['input']>;
  unitId?: InputMaybe<Scalars['String']['input']>;
};

export type NewPhone = {
  number?: InputMaybe<Scalars['String']['input']>;
  receiveTexts?: InputMaybe<Scalars['Boolean']['input']>;
};

export type NewUser = {
  cognitoId: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  member: NewMember;
};

export type Notification = {
  __typename?: 'Notification';
  active: Scalars['Boolean']['output'];
  body: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  createdBy?: Maybe<User>;
  createdById?: Maybe<Scalars['String']['output']>;
  docType: DocType;
  expiration?: Maybe<Scalars['String']['output']>;
  frequency: NotificationFrequency;
  id: Scalars['ID']['output'];
  memberNotification?: Maybe<MemberNotification>;
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  org: Organization;
  orgId: Scalars['String']['output'];
  rankIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  ranks: Array<Maybe<Rank>>;
  removedAt?: Maybe<Scalars['String']['output']>;
  seen?: Maybe<Scalars['Boolean']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export enum NotificationFrequency {
  Always = 'ALWAYS',
  Once = 'ONCE',
  UntilExpire = 'UNTIL_EXPIRE'
}

export type NotificationSearchInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type NotificationSearchResult = {
  __typename?: 'NotificationSearchResult';
  items?: Maybe<Array<Maybe<Notification>>>;
  total: Scalars['Int']['output'];
};

export type OperationalPeriod = {
  __typename?: 'OperationalPeriod';
  date: Scalars['Date']['output'];
};

export type Organization = {
  __typename?: 'Organization';
  address?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  contact?: Maybe<OrganizationContact>;
  createdAt: Scalars['String']['output'];
  customizations?: Maybe<OrganizationCustomizations>;
  docType: DocType;
  docusign?: Maybe<DocusignSettings>;
  features: OrganizationFeatures;
  flatFeatures: Scalars['String']['output'];
  fromEmail?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  settings?: Maybe<OrganizationOvertimeSettings>;
  sso?: Maybe<OrganizationSsoSettings>;
  ssoAppName?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  timezone: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
  weekBegins?: Maybe<DayOfWeek>;
  zip?: Maybe<Scalars['String']['output']>;
};

export type OrganizationContact = {
  __typename?: 'OrganizationContact';
  email?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
};

export type OrganizationCustomizations = {
  __typename?: 'OrganizationCustomizations';
  dateFormats: OrganizationDateFormats;
  pNumber: Scalars['String']['output'];
  tiers: OrganizationCustomizationsTiers;
};

export type OrganizationCustomizationsTier = {
  __typename?: 'OrganizationCustomizationsTier';
  enabled: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
};

export type OrganizationCustomizationsTiers = {
  __typename?: 'OrganizationCustomizationsTiers';
  TIER_1: OrganizationCustomizationsTier;
  TIER_2: OrganizationCustomizationsTier;
  TIER_3: OrganizationCustomizationsTier;
  TIER_4: OrganizationCustomizationsTier;
};

export type OrganizationDateFormats = {
  __typename?: 'OrganizationDateFormats';
  date: Scalars['String']['output'];
  dateTime: Scalars['String']['output'];
  miniDate: Scalars['String']['output'];
  time: Scalars['String']['output'];
};

export type OrganizationFeatureOptions = {
  __typename?: 'OrganizationFeatureOptions';
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type OrganizationFeatures = {
  __typename?: 'OrganizationFeatures';
  autoEnroll: Scalars['Boolean']['output'];
  callSign: Scalars['Boolean']['output'];
  customizableShiftId: Scalars['Boolean']['output'];
  disabledTierUntil: Scalars['Boolean']['output'];
  disabledTiers: Scalars['Boolean']['output'];
  docusign: Scalars['Boolean']['output'];
  docusignCheckout: Scalars['Boolean']['output'];
  endOfShiftPDF: Scalars['Boolean']['output'];
  equipment: Scalars['Boolean']['output'];
  eventCheckIn: Scalars['Boolean']['output'];
  eventCheckOut: Scalars['Boolean']['output'];
  eventInvoice: Scalars['Boolean']['output'];
  eventTemplates: Scalars['Boolean']['output'];
  externalEventRequests: Scalars['Boolean']['output'];
  financeUnit: Scalars['Boolean']['output'];
  incidentEvents: Scalars['Boolean']['output'];
  interestLists: Scalars['Boolean']['output'];
  kiosk: Scalars['Boolean']['output'];
  lasdEventFields: Scalars['Boolean']['output'];
  lasdUserFields: Scalars['Boolean']['output'];
  lottery: Scalars['Boolean']['output'];
  monthlyMaxHours: Scalars['Boolean']['output'];
  noShowReport: Scalars['Boolean']['output'];
  officerCheckInOut: Scalars['Boolean']['output'];
  outsideUserList: Scalars['Boolean']['output'];
  profileTenor: Scalars['Boolean']['output'];
  rankGrouping: Scalars['Boolean']['output'];
  rankHourlyRate: Scalars['Boolean']['output'];
  signingAuthorityAssignment: Scalars['Boolean']['output'];
  sso: Scalars['Boolean']['output'];
  vehicleCategories: Scalars['Boolean']['output'];
  venueContractDates: Scalars['Boolean']['output'];
  weeklyMaxShifts: Scalars['Boolean']['output'];
};

export type OrganizationOvertimeSettings = {
  __typename?: 'OrganizationOvertimeSettings';
  checkInOut?: Maybe<CheckInOutSetting>;
  hoursPerMonth: Scalars['Int']['output'];
  interestList?: Maybe<InterestListSetting>;
  lottery: LotterySettings;
  secondaryShiftReminder?: Maybe<ShiftReminder>;
  shiftBuffer: ShiftBuffer;
  shiftReminder: ShiftReminder;
  shiftsPerWeek: Scalars['Int']['output'];
  userRelinquishShift: UserRelinquishShift;
};

export type OrganizationSsoSettings = {
  __typename?: 'OrganizationSSOSettings';
  enablePasswordLogin?: Maybe<Scalars['Boolean']['output']>;
  metadataDocUrl?: Maybe<Scalars['String']['output']>;
  uiSubDomains?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type OrganizationSearchInput = {
  excludeIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  queryField?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type OrganizationSearchResult = {
  __typename?: 'OrganizationSearchResult';
  items?: Maybe<Array<Maybe<Organization>>>;
  total: Scalars['Int']['output'];
};

export type OutsideUser = {
  __typename?: 'OutsideUser';
  createdAt: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  org: Organization;
  orgId: Scalars['String']['output'];
  pNumber: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type OutsideUserSearchResult = {
  __typename?: 'OutsideUserSearchResult';
  items?: Maybe<Array<OutsideUser>>;
  total: Scalars['Int']['output'];
};

export type Phone = {
  __typename?: 'Phone';
  number?: Maybe<Scalars['String']['output']>;
  receiveTexts?: Maybe<Scalars['Boolean']['output']>;
};

export type ProfilePhotoAttachmentUpload = {
  __typename?: 'ProfilePhotoAttachmentUpload';
  imagePath: Scalars['String']['output'];
  uploadUrl: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  activeLottery?: Maybe<Scalars['Boolean']['output']>;
  activeNotifications?: Maybe<NotificationSearchResult>;
  allUsers?: Maybe<UserSearchResult>;
  assignment?: Maybe<Assignment>;
  assignments?: Maybe<AssignmentSearchResult>;
  availableShifts?: Maybe<ShiftSearchResult>;
  division?: Maybe<Division>;
  divisions?: Maybe<DivisionSearchResult>;
  docusignEvents?: Maybe<DocusignEventSearchResult>;
  equipment?: Maybe<Equipment>;
  equipments?: Maybe<EquipmentSearchResult>;
  event?: Maybe<Event>;
  events?: Maybe<EventSearchResult>;
  financeShifts?: Maybe<Array<Maybe<FinanceShift>>>;
  groupedShifts?: Maybe<Array<Maybe<Shift>>>;
  health?: Maybe<Scalars['String']['output']>;
  inAppNotifications?: Maybe<InAppNotificationSearchResult>;
  incidentForms?: Maybe<IncidentFormSearchResult>;
  lotteryCounter?: Maybe<LotteryCounter>;
  lotteryCounters?: Maybe<LotteryCounterSearchResult>;
  lotteryShifts?: Maybe<ShiftSearchResult>;
  lottoAnalytics?: Maybe<LottoAnalytics>;
  me?: Maybe<User>;
  memberEquipments?: Maybe<MemberEquipmentSearchResult>;
  memberSkills?: Maybe<MemberSkillSearchResult>;
  notification?: Maybe<Notification>;
  notifications?: Maybe<NotificationSearchResult>;
  organization?: Maybe<Organization>;
  organizationById?: Maybe<Organization>;
  organizationFeatures?: Maybe<Array<Maybe<OrganizationFeatureOptions>>>;
  organizations?: Maybe<OrganizationSearchResult>;
  outsideUsers?: Maybe<OutsideUserSearchResult>;
  rank?: Maybe<Rank>;
  rankGroups?: Maybe<RankGroupSearchResult>;
  ranks?: Maybe<RankSearchResult>;
  shift?: Maybe<Shift>;
  shiftBufferRequests?: Maybe<ShiftBufferRequestsSearchResult>;
  shiftInterestRequests?: Maybe<ShiftInterestRequestsSearchResult>;
  shiftLotteryRequests?: Maybe<ShiftLotteryRequestsSearchResult>;
  shiftLottoRequests?: Maybe<ShiftLotteryRequestsSearchResult>;
  shiftTabs?: Maybe<ShiftTabResponse>;
  shiftUsers?: Maybe<UserSearchResult>;
  shifts?: Maybe<ShiftSearchResult>;
  signingAuthorityAssignments?: Maybe<AssignmentSearchResult>;
  siteLock?: Maybe<SiteLock>;
  skill?: Maybe<Skill>;
  skills?: Maybe<SkillSearchResult>;
  unit?: Maybe<Unit>;
  units?: Maybe<UnitSearchResult>;
  user?: Maybe<User>;
  users?: Maybe<UserSearchResult>;
  vehicleCategories?: Maybe<VehicleCategoriesSearchResult>;
  vehicleCategory?: Maybe<Division>;
  venue?: Maybe<Venue>;
  venues?: Maybe<VenueSearchResult>;
};


export type QueryActiveNotificationsArgs = {
  input?: InputMaybe<SearchInput>;
};


export type QueryAllUsersArgs = {
  input?: InputMaybe<AllUsersSearchInput>;
};


export type QueryAssignmentArgs = {
  id: Scalars['String']['input'];
};


export type QueryAssignmentsArgs = {
  input?: InputMaybe<AssignmentSearchInput>;
};


export type QueryAvailableShiftsArgs = {
  input?: InputMaybe<AvailableShiftsSearchInput>;
};


export type QueryDivisionArgs = {
  id: Scalars['String']['input'];
};


export type QueryDivisionsArgs = {
  input?: InputMaybe<DivisionSearchInput>;
};


export type QueryDocusignEventsArgs = {
  input: DocusignEventSearchInput;
};


export type QueryEquipmentArgs = {
  id: Scalars['String']['input'];
};


export type QueryEquipmentsArgs = {
  input?: InputMaybe<EquipmentSearchInput>;
};


export type QueryEventArgs = {
  id: Scalars['String']['input'];
};


export type QueryEventsArgs = {
  input?: InputMaybe<EventSearchInput>;
};


export type QueryFinanceShiftsArgs = {
  eventId: Scalars['ObjectId']['input'];
};


export type QueryGroupedShiftsArgs = {
  shiftId: Scalars['String']['input'];
};


export type QueryInAppNotificationsArgs = {
  input?: InputMaybe<InAppNotificationSearchInput>;
};


export type QueryIncidentFormsArgs = {
  input?: InputMaybe<IncidentFormSearchInput>;
  report?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryLotteryCounterArgs = {
  counter?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryLotteryCountersArgs = {
  input?: InputMaybe<SearchInput>;
};


export type QueryLottoAnalyticsArgs = {
  userId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMemberEquipmentsArgs = {
  input?: InputMaybe<MemberEquipmentSearchInput>;
};


export type QueryMemberSkillsArgs = {
  input?: InputMaybe<MemberSkillSearchInput>;
};


export type QueryNotificationArgs = {
  id: Scalars['String']['input'];
};


export type QueryNotificationsArgs = {
  input?: InputMaybe<NotificationSearchInput>;
};


export type QueryOrganizationByIdArgs = {
  orgId: Scalars['String']['input'];
};


export type QueryOrganizationsArgs = {
  input?: InputMaybe<OrganizationSearchInput>;
};


export type QueryOutsideUsersArgs = {
  input?: InputMaybe<SearchInput>;
};


export type QueryRankArgs = {
  id: Scalars['String']['input'];
};


export type QueryRankGroupsArgs = {
  input?: InputMaybe<RankGroupSearchInput>;
};


export type QueryRanksArgs = {
  input?: InputMaybe<RankSearchInput>;
};


export type QueryShiftArgs = {
  id: Scalars['String']['input'];
};


export type QueryShiftBufferRequestsArgs = {
  input?: InputMaybe<ShiftBufferRequestsSearchInput>;
};


export type QueryShiftInterestRequestsArgs = {
  input?: InputMaybe<ShiftInterestRequestsSearchInput>;
};


export type QueryShiftLotteryRequestsArgs = {
  input?: InputMaybe<ShiftLotteryRequestsSearchInput>;
};


export type QueryShiftLottoRequestsArgs = {
  input: ShiftLottoRequestsSearchInput;
};


export type QueryShiftTabsArgs = {
  id: Scalars['String']['input'];
};


export type QueryShiftUsersArgs = {
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};


export type QueryShiftsArgs = {
  input?: InputMaybe<ShiftSearchInput>;
};


export type QuerySigningAuthorityAssignmentsArgs = {
  eventId: Scalars['ObjectId']['input'];
};


export type QuerySkillArgs = {
  id: Scalars['String']['input'];
};


export type QuerySkillsArgs = {
  input?: InputMaybe<SkillSearchInput>;
};


export type QueryUnitArgs = {
  id: Scalars['String']['input'];
};


export type QueryUnitsArgs = {
  input?: InputMaybe<UnitSearchInput>;
};


export type QueryUserArgs = {
  id: Scalars['String']['input'];
  shiftStart?: InputMaybe<Scalars['String']['input']>;
  timezoneOffset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUsersArgs = {
  input?: InputMaybe<UserSearchInput>;
};


export type QueryVehicleCategoriesArgs = {
  input?: InputMaybe<VehicleCategoriesSearchInput>;
};


export type QueryVehicleCategoryArgs = {
  id: Scalars['String']['input'];
};


export type QueryVenueArgs = {
  id: Scalars['String']['input'];
};


export type QueryVenuesArgs = {
  input?: InputMaybe<VenueSearchInput>;
};

export type Rank = {
  __typename?: 'Rank';
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  docType: DocType;
  hourlyRate?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  incidentHourlyRate?: Maybe<Scalars['Float']['output']>;
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  org?: Maybe<Organization>;
  orgId: Scalars['String']['output'];
  rankGroup?: Maybe<RankGroup>;
  rankGroupId?: Maybe<Scalars['String']['output']>;
  removedAt?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type RankGroup = {
  __typename?: 'RankGroup';
  createdAt: Scalars['String']['output'];
  docType: DocType;
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  org?: Maybe<Organization>;
  orgId: Scalars['String']['output'];
  rankIds?: Maybe<Array<Scalars['String']['output']>>;
  ranks?: Maybe<Array<Rank>>;
  removedAt?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type RankGroupSearchInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type RankGroupSearchResult = {
  __typename?: 'RankGroupSearchResult';
  items?: Maybe<Array<Maybe<RankGroup>>>;
  total: Scalars['Int']['output'];
};

export type RankSearchInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type RankSearchResult = {
  __typename?: 'RankSearchResult';
  items?: Maybe<Array<Maybe<Rank>>>;
  total: Scalars['Int']['output'];
};

export type SearchDateFilter = {
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  value?: InputMaybe<Scalars['DateTime']['input']>;
};

export type SearchInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type SearchTimeFilter = {
  gte?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type SearchTimeRange = {
  endTime?: InputMaybe<SearchTimeFilter>;
  removedAt?: InputMaybe<SearchTimeFilter>;
  startTime?: InputMaybe<SearchTimeFilter>;
};

export type Shift = {
  __typename?: 'Shift';
  assignment: Assignment;
  assignmentId: Scalars['String']['output'];
  availability?: Maybe<ShiftAvailabilityTime>;
  callSign?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  createdBy?: Maybe<User>;
  createdById?: Maybe<Scalars['String']['output']>;
  customId: Scalars['String']['output'];
  docType: DocType;
  docusignEvent?: Maybe<DocusignEvent>;
  endTime: Scalars['String']['output'];
  event: Event;
  eventId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  locked?: Maybe<Scalars['Boolean']['output']>;
  lotteryRequest?: Maybe<ShiftLotteryRequest>;
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  notificationId?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  org: Organization;
  orgId: Scalars['String']['output'];
  otherShiftSlots?: Maybe<Array<Maybe<Shift>>>;
  refNumber: Scalars['Int']['output'];
  relinquishNote?: Maybe<Scalars['String']['output']>;
  removedAt?: Maybe<Scalars['String']['output']>;
  shiftBufferShift?: Maybe<Shift>;
  shiftCheckInOut?: Maybe<ShiftCheckInOut>;
  shiftId: Scalars['String']['output'];
  shiftInterestRequest?: Maybe<ShiftInterestRequest>;
  startTime: Scalars['String']['output'];
  status: ShiftStatus;
  updatedAt: Scalars['String']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type ShiftAdminCheckInOutEvent = {
  adminNotes?: InputMaybe<Scalars['String']['input']>;
  /** @deprecated Use equipmentDetails instead! */
  checkInEquipmentTime?: InputMaybe<Scalars['Float']['input']>;
  checkInTime?: InputMaybe<Scalars['String']['input']>;
  /** @deprecated Use equipmentDetails instead! */
  checkOutEquipmentTime?: InputMaybe<Scalars['Float']['input']>;
  checkOutTime?: InputMaybe<Scalars['String']['input']>;
  customShiftId?: InputMaybe<Scalars['String']['input']>;
  equipmentDetails?: InputMaybe<ShiftCheckInOutEquipmentEvent>;
  id: Scalars['String']['input'];
  noShow?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ShiftAvailabilityTime = {
  __typename?: 'ShiftAvailabilityTime';
  friday?: Maybe<ShiftDayTime>;
  monday?: Maybe<ShiftDayTime>;
  saturday?: Maybe<ShiftDayTime>;
  sunday?: Maybe<ShiftDayTime>;
  thursday?: Maybe<ShiftDayTime>;
  tuesday?: Maybe<ShiftDayTime>;
  wednesday?: Maybe<ShiftDayTime>;
};

export type ShiftBuffer = {
  __typename?: 'ShiftBuffer';
  adminOverrideShiftBuffer: Scalars['Boolean']['output'];
  enabled: Scalars['Boolean']['output'];
  minuteShiftBuffer: Scalars['Int']['output'];
};

export type ShiftBufferRequest = {
  __typename?: 'ShiftBufferRequest';
  assignment: Assignment;
  assignmentId: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  endTime: Scalars['String']['output'];
  event: Event;
  eventId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  note?: Maybe<Scalars['String']['output']>;
  org: Organization;
  orgId: Scalars['String']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  removedAt?: Maybe<Scalars['String']['output']>;
  shift: Shift;
  shiftBufferShift: Shift;
  shiftBufferShiftId: Scalars['String']['output'];
  shiftGroupId: Scalars['String']['output'];
  shiftId: Scalars['String']['output'];
  startTime: Scalars['String']['output'];
  status: ShiftBufferRequestStatus;
  updatedAt: Scalars['String']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export enum ShiftBufferRequestStatus {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export type ShiftBufferRequestsSearchInput = {
  endTime?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type ShiftBufferRequestsSearchResult = {
  __typename?: 'ShiftBufferRequestsSearchResult';
  items?: Maybe<Array<Maybe<ShiftBufferRequest>>>;
  total: Scalars['Int']['output'];
};

export type ShiftCheckInOut = {
  __typename?: 'ShiftCheckInOut';
  adminNotes?: Maybe<Scalars['String']['output']>;
  checkInCoords?: Maybe<ShiftCheckInOutCoordinates>;
  /** @deprecated Use equipmentDetails instead! */
  checkInEquipmentTime?: Maybe<Scalars['Float']['output']>;
  checkInNote?: Maybe<Scalars['String']['output']>;
  checkInTime?: Maybe<Scalars['String']['output']>;
  checkOutCoords?: Maybe<ShiftCheckInOutCoordinates>;
  /** @deprecated Use equipmentDetails instead! */
  checkOutEquipmentTime?: Maybe<Scalars['Float']['output']>;
  checkOutNote?: Maybe<Scalars['String']['output']>;
  checkOutTime?: Maybe<Scalars['String']['output']>;
  equipmentDetails?: Maybe<ShiftCheckInOutEquipment>;
  noShow?: Maybe<Scalars['Boolean']['output']>;
};

export type ShiftCheckInOutCoordinates = {
  __typename?: 'ShiftCheckInOutCoordinates';
  accuracy?: Maybe<Scalars['Float']['output']>;
  altitude?: Maybe<Scalars['Float']['output']>;
  altitudeAccuracy?: Maybe<Scalars['Float']['output']>;
  heading?: Maybe<Scalars['Float']['output']>;
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  speed?: Maybe<Scalars['Float']['output']>;
};

export type ShiftCheckInOutEquipment = {
  __typename?: 'ShiftCheckInOutEquipment';
  checkInTime?: Maybe<Scalars['String']['output']>;
  checkOutTime?: Maybe<Scalars['String']['output']>;
  vehicleCategory?: Maybe<VehicleCategories>;
  vehicleCategoryId?: Maybe<Scalars['String']['output']>;
};

export type ShiftCheckInOutEquipmentEvent = {
  checkInTime?: InputMaybe<Scalars['String']['input']>;
  checkOutTime?: InputMaybe<Scalars['String']['input']>;
  vehicleCategoryId?: InputMaybe<Scalars['String']['input']>;
};

export type ShiftCheckInOutEvent = {
  adminNotes?: InputMaybe<Scalars['String']['input']>;
  coords?: InputMaybe<CheckInOutCoordinates>;
  equipmentDateTime?: InputMaybe<Scalars['String']['input']>;
  /** @deprecated Use equipmentDateTime instead! */
  equipmentTime?: InputMaybe<Scalars['Float']['input']>;
  id: Scalars['String']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  signNow?: InputMaybe<Scalars['Boolean']['input']>;
  time?: InputMaybe<Scalars['String']['input']>;
  vehicleCategoryId?: InputMaybe<Scalars['String']['input']>;
};

export type ShiftCheckOutResponse = {
  __typename?: 'ShiftCheckOutResponse';
  shift: Shift;
  signingUrl?: Maybe<Scalars['String']['output']>;
};

export type ShiftDayTime = {
  __typename?: 'ShiftDayTime';
  endTime: Scalars['String']['output'];
  startTime: Scalars['String']['output'];
};

export type ShiftDetails = {
  __typename?: 'ShiftDetails';
  arrivalAtUOA?: Maybe<Scalars['DateTime']['output']>;
  enrouteToIncident?: Maybe<Scalars['DateTime']['output']>;
  staging1097?: Maybe<Scalars['DateTime']['output']>;
  staging1098?: Maybe<Scalars['DateTime']['output']>;
  time18Hour?: Maybe<Scalars['DateTime']['output']>;
};

export type ShiftInterestRequest = {
  __typename?: 'ShiftInterestRequest';
  assignedShift?: Maybe<Shift>;
  assignment: Assignment;
  assignmentId: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  event: Event;
  eventId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  org: Organization;
  orgId: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  shift?: Maybe<Shift>;
  shiftGroupId: Scalars['String']['output'];
  status?: Maybe<ShiftInterestRequestStatus>;
  updatedAt: Scalars['String']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};


export type ShiftInterestRequestUserArgs = {
  ignoreShiftId?: InputMaybe<Scalars['String']['input']>;
  shiftStart?: InputMaybe<Scalars['String']['input']>;
  timezoneOffset?: InputMaybe<Scalars['Int']['input']>;
};

export enum ShiftInterestRequestStatus {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED',
  Removed = 'REMOVED'
}

export type ShiftInterestRequestsSearchInput = {
  includeRemoved?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  shiftGroupId: Scalars['String']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type ShiftInterestRequestsSearchResult = {
  __typename?: 'ShiftInterestRequestsSearchResult';
  items?: Maybe<Array<Maybe<ShiftInterestRequest>>>;
  total: Scalars['Int']['output'];
};

export type ShiftLotteryRequest = {
  __typename?: 'ShiftLotteryRequest';
  assignment: Assignment;
  assignmentId: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  event: Event;
  eventId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lotteryCounter: Scalars['Int']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  org: Organization;
  orgId: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  shift?: Maybe<Shift>;
  shiftGroupId: Scalars['String']['output'];
  status?: Maybe<ShiftLotteryRequestStatus>;
  updatedAt: Scalars['String']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};


export type ShiftLotteryRequestUserArgs = {
  shiftStart?: InputMaybe<Scalars['String']['input']>;
  timezoneOffset?: InputMaybe<Scalars['Int']['input']>;
};

export enum ShiftLotteryRequestStatus {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED',
  Removed = 'REMOVED'
}

export type ShiftLotteryRequestsSearchInput = {
  counters?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  includeRemoved?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type ShiftLotteryRequestsSearchResult = {
  __typename?: 'ShiftLotteryRequestsSearchResult';
  items?: Maybe<Array<Maybe<ShiftLotteryRequest>>>;
  total: Scalars['Int']['output'];
};

export type ShiftLottoRequestsSearchInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  lotteryCounter: Scalars['Int']['input'];
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  shiftGroupId: Scalars['String']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type ShiftReminder = {
  __typename?: 'ShiftReminder';
  enabled: Scalars['Boolean']['output'];
  time: Scalars['Int']['output'];
  unit: ShiftReminderUnit;
};

export enum ShiftReminderUnit {
  Day = 'DAY',
  Hour = 'HOUR',
  Minute = 'MINUTE'
}

export type ShiftSearchInput = {
  assignedIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  assignmentId?: InputMaybe<Scalars['String']['input']>;
  createdById?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daysOfWeek?: InputMaybe<Array<DayOfWeek>>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  eventIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  includeRemoved?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  queryField?: InputMaybe<Scalars['String']['input']>;
  range?: InputMaybe<SearchTimeRange>;
  rangeField?: InputMaybe<Scalars['String']['input']>;
  rankIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  refNumber?: InputMaybe<Scalars['String']['input']>;
  skillIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Array<InputMaybe<ShiftStatus>>>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type ShiftSearchResult = {
  __typename?: 'ShiftSearchResult';
  items?: Maybe<Array<Maybe<Shift>>>;
  total: Scalars['Int']['output'];
};

export enum ShiftStatus {
  Assigned = 'ASSIGNED',
  Available = 'AVAILABLE',
  Locked = 'LOCKED',
  Relinquished = 'RELINQUISHED',
  Removed = 'REMOVED',
  Unassigned = 'UNASSIGNED'
}

export type ShiftTabResponse = {
  __typename?: 'ShiftTabResponse';
  data: Scalars['String']['output'];
  orgId: Scalars['String']['output'];
  templateName: Scalars['String']['output'];
};

export type ShiftUpdates = {
  endTime?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
};

export type SiteLock = {
  __typename?: 'SiteLock';
  createdAt: Scalars['String']['output'];
  docType: DocType;
  id: Scalars['ID']['output'];
  locked: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  org?: Maybe<Organization>;
  orgId: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type Skill = {
  __typename?: 'Skill';
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  docType: DocType;
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  org: Organization;
  orgId: Scalars['String']['output'];
  rankOnlyIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  ranksOnly?: Maybe<Array<Maybe<Rank>>>;
  removedAt?: Maybe<Scalars['String']['output']>;
  requiresAdminApproval: Scalars['Boolean']['output'];
  requiresCert: Scalars['Boolean']['output'];
  updatedAt: Scalars['String']['output'];
};

export type SkillSearchInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  rankOnlyIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  requiresAdminApproval?: InputMaybe<Scalars['Boolean']['input']>;
  requiresCert?: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type SkillSearchResult = {
  __typename?: 'SkillSearchResult';
  items?: Maybe<Array<Maybe<Skill>>>;
  total: Scalars['Int']['output'];
};

export enum SkillStatus {
  Approved = 'APPROVED',
  Denied = 'DENIED',
  Pending = 'PENDING'
}

export type Timekeeping = {
  __typename?: 'Timekeeping';
  overtimeHours?: Maybe<Scalars['Float']['output']>;
  overtimeTimeIn?: Maybe<Scalars['DateTime']['output']>;
  overtimeTimeOut?: Maybe<Scalars['DateTime']['output']>;
  rdo?: Maybe<Scalars['String']['output']>;
  straightHours?: Maybe<Scalars['Float']['output']>;
  timeIn?: Maybe<Scalars['DateTime']['output']>;
  timeOut?: Maybe<Scalars['DateTime']['output']>;
  type?: Maybe<TimekeepingType>;
};

export enum TimekeepingType {
  Paid = 'PAID',
  Saved = 'SAVED'
}

export type Unit = {
  __typename?: 'Unit';
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  divisionIds?: Maybe<Array<Scalars['String']['output']>>;
  divisions?: Maybe<Array<Maybe<Division>>>;
  docType: DocType;
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  org?: Maybe<Organization>;
  orgId: Scalars['String']['output'];
  overtimeCode?: Maybe<Scalars['String']['output']>;
  removedAt?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type UnitSearchInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type UnitSearchResult = {
  __typename?: 'UnitSearchResult';
  items?: Maybe<Array<Maybe<Unit>>>;
  total: Scalars['Int']['output'];
};

export type UpdateUser = {
  cognitoId: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  imagePath?: InputMaybe<Scalars['String']['input']>;
  lastName: Scalars['String']['input'];
  member?: InputMaybe<NewMember>;
};

export type UpsertAfterShiftRemove = {
  days: Scalars['Int']['input'];
  tier: MemberTier;
};

export type UpsertAssignment = {
  bwNeeded?: InputMaybe<Scalars['Boolean']['input']>;
  callSign?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  eventId: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  isSigningAuthority?: InputMaybe<Scalars['Boolean']['input']>;
  lieutenantAssignmentId?: InputMaybe<Scalars['String']['input']>;
  /** @deprecated Use lieutenantAssignmentId instead! */
  lieutenantId?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notifyWhenFullyStaffed?: InputMaybe<Scalars['Boolean']['input']>;
  rankIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  reportingLocation?: InputMaybe<Scalars['String']['input']>;
  requiredEquipmentIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  requiredSkillIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  shiftIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  shiftSlots?: InputMaybe<Array<InputMaybe<UpsertAssignmentShiftSlot>>>;
  supervisorAssignmentId?: InputMaybe<Scalars['String']['input']>;
  /** @deprecated Use supervisorAssignmentId instead! */
  supervisorId?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertAssignmentShiftSlot = {
  id?: InputMaybe<Scalars['String']['input']>;
  slotCount?: InputMaybe<Scalars['Int']['input']>;
};

export type UpsertCheckInOutSetting = {
  minutesAfterShiftEnd: Scalars['Int']['input'];
  minutesBeforeShiftStart: Scalars['Int']['input'];
};

export type UpsertDivision = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertEquipment = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  rankOnlyIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  requiresAdminApproval?: InputMaybe<Scalars['Boolean']['input']>;
  requiresCert?: InputMaybe<Scalars['Boolean']['input']>;
  requiresEquipmentTime?: InputMaybe<Scalars['Boolean']['input']>;
  requiresVehicleInformation?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpsertEvent = {
  assignmentIds: Array<InputMaybe<Scalars['String']['input']>>;
  attachmentPaths?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  autoAssignInterestList?: InputMaybe<Scalars['Boolean']['input']>;
  budgetActivityCode?: InputMaybe<Scalars['String']['input']>;
  /** @deprecated Use the assignments callSign instead! */
  callSign?: InputMaybe<Scalars['String']['input']>;
  createdById?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  interestListAutoAssignCutoff?: InputMaybe<Scalars['String']['input']>;
  interestListTransition?: InputMaybe<EventStatus>;
  lieutenantId?: InputMaybe<Scalars['String']['input']>;
  lotteryNumber?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  notifyOnFirstComeFirstServe?: InputMaybe<Scalars['Boolean']['input']>;
  notifyWhenFullyStaffed?: InputMaybe<Scalars['Boolean']['input']>;
  ocn?: InputMaybe<Scalars['String']['input']>;
  outsideOrgCode?: InputMaybe<Scalars['String']['input']>;
  overtimeReasonCode?: InputMaybe<Scalars['String']['input']>;
  requestDetails?: InputMaybe<InputEventRequestDetails>;
  requiredSkillIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  scheduledCloseInterestList?: InputMaybe<Scalars['String']['input']>;
  scheduledFirstComeFirstServe?: InputMaybe<Scalars['String']['input']>;
  scheduledInterestList?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EventStatus>;
  supervisorId?: InputMaybe<Scalars['String']['input']>;
  venueId?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertInterestListSetting = {
  defaultAutoHireCutoff?: InputMaybe<Scalars['Int']['input']>;
  defaultHoursBeforeShift?: InputMaybe<Scalars['Int']['input']>;
  defaultNotificationTime?: InputMaybe<Scalars['Int']['input']>;
};

export type UpsertLotteryDate = {
  dayOfWeek: DayOfWeek;
  time: Scalars['String']['input'];
};

export type UpsertLotterySettings = {
  close: UpsertLotteryDate;
  enabled: Scalars['Boolean']['input'];
  fcfsShiftsDelay: Scalars['Int']['input'];
  notifyUsersBeforeClose: Scalars['Int']['input'];
  open: UpsertLotteryDate;
};

export type UpsertMemberEquipment = {
  equipmentId: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  imagePath?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EquipmentStatus>;
  statusReason?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
};

export type UpsertMemberSkill = {
  id?: InputMaybe<Scalars['String']['input']>;
  imagePath?: InputMaybe<Scalars['String']['input']>;
  skillId: Scalars['String']['input'];
  status?: InputMaybe<SkillStatus>;
  statusReason?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
};

export type UpsertNotification = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  body?: InputMaybe<Scalars['String']['input']>;
  expiration?: InputMaybe<Scalars['String']['input']>;
  frequency?: InputMaybe<NotificationFrequency>;
  id?: InputMaybe<Scalars['String']['input']>;
  rankIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  title: Scalars['String']['input'];
};

export type UpsertOrganization = {
  address?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contact?: InputMaybe<UpsertOrganizationContact>;
  customizations?: InputMaybe<UpsertOrganizationCustomizations>;
  features?: InputMaybe<UpsertOrganizationFeatures>;
  fromEmail?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<UpsertOrganizationOvertimeSettings>;
  sso?: InputMaybe<UpsertOrganizationSsoSettings>;
  state?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  weekBegins?: InputMaybe<DayOfWeek>;
  zip?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertOrganizationContact = {
  email: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};

export type UpsertOrganizationCustomizations = {
  pNumber: Scalars['String']['input'];
  tiers: UpsertOrganizationCustomizationsTiers;
};

export type UpsertOrganizationCustomizationsTier = {
  enabled: Scalars['Boolean']['input'];
  label: Scalars['String']['input'];
};

export type UpsertOrganizationCustomizationsTiers = {
  TIER_1: UpsertOrganizationCustomizationsTier;
  TIER_2: UpsertOrganizationCustomizationsTier;
  TIER_3: UpsertOrganizationCustomizationsTier;
  TIER_4: UpsertOrganizationCustomizationsTier;
};

export type UpsertOrganizationFeatures = {
  autoEnroll?: InputMaybe<Scalars['Boolean']['input']>;
  callSign?: InputMaybe<Scalars['Boolean']['input']>;
  customizableShiftId?: InputMaybe<Scalars['Boolean']['input']>;
  disabledTierUntil?: InputMaybe<Scalars['Boolean']['input']>;
  disabledTiers?: InputMaybe<Scalars['Boolean']['input']>;
  docusign?: InputMaybe<Scalars['Boolean']['input']>;
  docusignCheckout?: InputMaybe<Scalars['Boolean']['input']>;
  endOfShiftPDF?: InputMaybe<Scalars['Boolean']['input']>;
  equipment?: InputMaybe<Scalars['Boolean']['input']>;
  eventCheckIn?: InputMaybe<Scalars['Boolean']['input']>;
  eventCheckOut?: InputMaybe<Scalars['Boolean']['input']>;
  eventInvoice?: InputMaybe<Scalars['Boolean']['input']>;
  eventTemplates?: InputMaybe<Scalars['Boolean']['input']>;
  externalEventRequests?: InputMaybe<Scalars['Boolean']['input']>;
  financeUnit?: InputMaybe<Scalars['Boolean']['input']>;
  incidentEvents?: InputMaybe<Scalars['Boolean']['input']>;
  interestLists?: InputMaybe<Scalars['Boolean']['input']>;
  kiosk?: InputMaybe<Scalars['Boolean']['input']>;
  lasdEventFields?: InputMaybe<Scalars['Boolean']['input']>;
  lasdUserFields?: InputMaybe<Scalars['Boolean']['input']>;
  lottery?: InputMaybe<Scalars['Boolean']['input']>;
  monthlyMaxHours?: InputMaybe<Scalars['Boolean']['input']>;
  noShowReport?: InputMaybe<Scalars['Boolean']['input']>;
  officerCheckInOut?: InputMaybe<Scalars['Boolean']['input']>;
  outsideUserList?: InputMaybe<Scalars['Boolean']['input']>;
  profileTenor?: InputMaybe<Scalars['Boolean']['input']>;
  rankGrouping?: InputMaybe<Scalars['Boolean']['input']>;
  rankHourlyRate?: InputMaybe<Scalars['Boolean']['input']>;
  signingAuthorityAssignment?: InputMaybe<Scalars['Boolean']['input']>;
  sso?: InputMaybe<Scalars['Boolean']['input']>;
  vehicleCategories?: InputMaybe<Scalars['Boolean']['input']>;
  venueContractDates?: InputMaybe<Scalars['Boolean']['input']>;
  weeklyMaxShifts?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpsertOrganizationOvertimeSettings = {
  checkInOut?: InputMaybe<UpsertCheckInOutSetting>;
  hoursPerMonth?: InputMaybe<Scalars['Int']['input']>;
  interestList?: InputMaybe<UpsertInterestListSetting>;
  lottery: UpsertLotterySettings;
  secondaryShiftReminder?: InputMaybe<UpsertShiftReminder>;
  shiftBuffer: UpsertShiftBuffer;
  shiftReminder: UpsertShiftReminder;
  shiftsPerWeek: Scalars['Int']['input'];
  userRelinquishShift: UpsertUserRelinquishShift;
};

export type UpsertOrganizationSsoSettings = {
  enablePasswordLogin?: InputMaybe<Scalars['Boolean']['input']>;
  metadataDocUrl?: InputMaybe<Scalars['String']['input']>;
  uiSubDomains?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type UpsertRank = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  hourlyRate?: InputMaybe<Scalars['Float']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  incidentHourlyRate?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  rankGroupId?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertRankGroup = {
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  rankIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpsertShift = {
  assignmentId: Scalars['String']['input'];
  callSign?: InputMaybe<Scalars['String']['input']>;
  createdById?: InputMaybe<Scalars['String']['input']>;
  customId?: InputMaybe<Scalars['String']['input']>;
  endTime: Scalars['String']['input'];
  eventId: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  locked?: InputMaybe<Scalars['Boolean']['input']>;
  refNumber?: InputMaybe<Scalars['Int']['input']>;
  shiftId: Scalars['String']['input'];
  startTime: Scalars['String']['input'];
  status?: InputMaybe<ShiftStatus>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertShiftBuffer = {
  adminOverrideShiftBuffer: Scalars['Boolean']['input'];
  enabled: Scalars['Boolean']['input'];
  minuteShiftBuffer: Scalars['Int']['input'];
};

export type UpsertShiftInterestRequest = {
  id?: InputMaybe<Scalars['String']['input']>;
  shiftGroupId: Scalars['String']['input'];
  status?: InputMaybe<ShiftInterestRequestStatus>;
  userId: Scalars['String']['input'];
};

export type UpsertShiftLotteryRequest = {
  id?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  shiftGroupId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type UpsertShiftReminder = {
  enabled: Scalars['Boolean']['input'];
  time: Scalars['Int']['input'];
  unit: ShiftReminderUnit;
};

export type UpsertSiteLock = {
  locked?: InputMaybe<Scalars['Boolean']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertSkill = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  rankOnlyIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  requiresAdminApproval?: InputMaybe<Scalars['Boolean']['input']>;
  requiresCert?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpsertUnit = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  divisionIds?: InputMaybe<Array<Scalars['String']['input']>>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  overtimeCode?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertUserRelinquishShift = {
  afterShiftRemove: UpsertAfterShiftRemove;
  enabled: Scalars['Boolean']['input'];
  numberOfHoursBeforeShift: Scalars['Int']['input'];
  requireNoteWhenRelinquishing: Scalars['Boolean']['input'];
};

export type UpsertVehicleCategories = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  milageRate?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertVenue = {
  address?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contact?: InputMaybe<UpsertVenueContact>;
  contract?: InputMaybe<UpsertVenueContract>;
  id?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<VenueStatus>;
  zip?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertVenueContact = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertVenueContract = {
  expirationDate?: InputMaybe<Scalars['String']['input']>;
  insuranceName?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  browserNotificationSettings?: Maybe<Array<Maybe<BrowserNotificationSetting>>>;
  cognitoId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  docType: DocType;
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  image?: Maybe<Scalars['String']['output']>;
  imagePath?: Maybe<Scalars['String']['output']>;
  lastName: Scalars['String']['output'];
  member: Member;
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  numberOfHoursThisMonth?: Maybe<Scalars['Float']['output']>;
  numberOfShiftsThisWeek?: Maybe<Scalars['Int']['output']>;
  removedAt?: Maybe<Scalars['String']['output']>;
  shiftsThisWeek?: Maybe<Array<Maybe<Shift>>>;
  superAdmin: Scalars['Boolean']['output'];
  updatedAt: Scalars['String']['output'];
};

export type UserAvailability = {
  __typename?: 'UserAvailability';
  friday: DayAvailability;
  monday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
  thursday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
};

export type UserRelinquishShift = {
  __typename?: 'UserRelinquishShift';
  afterShiftRemove: AfterShiftRemove;
  enabled: Scalars['Boolean']['output'];
  numberOfHoursBeforeShift: Scalars['Int']['output'];
  requireNoteWhenRelinquishing: Scalars['Boolean']['output'];
};

export type UserSearchInput = {
  admin?: InputMaybe<Scalars['Boolean']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  exactPNumber?: InputMaybe<Scalars['String']['input']>;
  excludeIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pNumber?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  queryField?: InputMaybe<Scalars['String']['input']>;
  rankIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  skillIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  statuses?: InputMaybe<Array<InputMaybe<MemberStatus>>>;
  tiers?: InputMaybe<Array<InputMaybe<MemberTier>>>;
};

export type UserSearchResult = {
  __typename?: 'UserSearchResult';
  items?: Maybe<Array<Maybe<User>>>;
  total: Scalars['Int']['output'];
};

export type VehicleCategories = {
  __typename?: 'VehicleCategories';
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  docType: DocType;
  id: Scalars['ID']['output'];
  milageRate?: Maybe<Scalars['Float']['output']>;
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  org?: Maybe<Organization>;
  orgId: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type VehicleCategoriesSearchInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type VehicleCategoriesSearchResult = {
  __typename?: 'VehicleCategoriesSearchResult';
  items?: Maybe<Array<Maybe<VehicleCategories>>>;
  total: Scalars['Int']['output'];
};

export type VehicleInformation = {
  __typename?: 'VehicleInformation';
  endingMileage?: Maybe<Scalars['Float']['output']>;
  hasVehicle?: Maybe<Scalars['String']['output']>;
  startingMileage?: Maybe<Scalars['Float']['output']>;
  vehicleCategory?: Maybe<Scalars['ObjectId']['output']>;
  vehicleMake?: Maybe<Scalars['String']['output']>;
  vehicleModel?: Maybe<Scalars['String']['output']>;
  vehicleNumber?: Maybe<Scalars['String']['output']>;
};

export type Venue = {
  __typename?: 'Venue';
  address?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  contact?: Maybe<VenueContact>;
  contract?: Maybe<VenueContract>;
  createdAt: Scalars['String']['output'];
  docType: DocType;
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  org: Organization;
  orgId: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  removedAt?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  status?: Maybe<VenueStatus>;
  updatedAt: Scalars['String']['output'];
  zip?: Maybe<Scalars['String']['output']>;
};

export type VenueContact = {
  __typename?: 'VenueContact';
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
};

export type VenueContract = {
  __typename?: 'VenueContract';
  expirationDate?: Maybe<Scalars['String']['output']>;
  insuranceName?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type VenueSearchInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type VenueSearchResult = {
  __typename?: 'VenueSearchResult';
  items?: Maybe<Array<Maybe<Venue>>>;
  total: Scalars['Int']['output'];
};

export enum VenueStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Removed = 'REMOVED',
  Requested = 'REQUESTED'
}

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  ActivityLog: ResolverTypeWrapper<ActivityLog>;
  ActivityLogEntry: ResolverTypeWrapper<ActivityLogEntry>;
  AfterShiftRemove: ResolverTypeWrapper<AfterShiftRemove>;
  AllUsersSearchInput: AllUsersSearchInput;
  Assignment: ResolverTypeWrapper<Assignment>;
  AssignmentSearchInput: AssignmentSearchInput;
  AssignmentSearchResult: ResolverTypeWrapper<AssignmentSearchResult>;
  AssignmentShiftSlot: ResolverTypeWrapper<AssignmentShiftSlot>;
  AssignmentSummary: ResolverTypeWrapper<AssignmentSummary>;
  AvailabilityTime: ResolverTypeWrapper<AvailabilityTime>;
  AvailableShiftsSearchInput: AvailableShiftsSearchInput;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BrowserNotificationKeys: ResolverTypeWrapper<BrowserNotificationKeys>;
  BrowserNotificationSetting: ResolverTypeWrapper<BrowserNotificationSetting>;
  BrowserNotificationSubscription: ResolverTypeWrapper<BrowserNotificationSubscription>;
  CheckInOutCoordinates: CheckInOutCoordinates;
  CheckInOutSetting: ResolverTypeWrapper<CheckInOutSetting>;
  ContactInfo: ResolverTypeWrapper<ContactInfo>;
  CreateOrganization: CreateOrganization;
  CreateOutsideUser: CreateOutsideUser;
  CreateShiftBufferRequest: CreateShiftBufferRequest;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  DayAvailability: ResolverTypeWrapper<DayAvailability>;
  DayOfWeek: DayOfWeek;
  Division: ResolverTypeWrapper<Division>;
  DivisionSearchInput: DivisionSearchInput;
  DivisionSearchResult: ResolverTypeWrapper<DivisionSearchResult>;
  DocType: DocType;
  DocusignEvent: ResolverTypeWrapper<DocusignEvent>;
  DocusignEventSearchInput: DocusignEventSearchInput;
  DocusignEventSearchResult: ResolverTypeWrapper<DocusignEventSearchResult>;
  DocusignEventUserRole: DocusignEventUserRole;
  DocusignSettings: ResolverTypeWrapper<DocusignSettings>;
  DocusignSignerDetails: ResolverTypeWrapper<DocusignSignerDetails>;
  DocusignSignerDetailsData: ResolverTypeWrapper<DocusignSignerDetailsData>;
  Email: ResolverTypeWrapper<Email>;
  Equipment: ResolverTypeWrapper<Equipment>;
  EquipmentSearchInput: EquipmentSearchInput;
  EquipmentSearchResult: ResolverTypeWrapper<EquipmentSearchResult>;
  EquipmentStatus: EquipmentStatus;
  Event: ResolverTypeWrapper<Event>;
  EventAttachmentUpload: ResolverTypeWrapper<EventAttachmentUpload>;
  EventInvoiceResponse: ResolverTypeWrapper<EventInvoiceResponse>;
  EventRequestDetails: ResolverTypeWrapper<EventRequestDetails>;
  EventSearchInput: EventSearchInput;
  EventSearchResult: ResolverTypeWrapper<EventSearchResult>;
  EventStatus: EventStatus;
  FinanceShift: ResolverTypeWrapper<FinanceShift>;
  FinanceShiftSearchInput: FinanceShiftSearchInput;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  IActivityLog: IActivityLog;
  IActivityLogEntry: IActivityLogEntry;
  IAssignmentSummary: IAssignmentSummary;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  IIncidentForm: IIncidentForm;
  IMissionAssignments: IMissionAssignments;
  IOperationalPeriod: IOperationalPeriod;
  IShiftDetails: IShiftDetails;
  ITimekeeping: ITimekeeping;
  IVehicleInformation: IVehicleInformation;
  InAppNotificationMeta: ResolverTypeWrapper<InAppNotificationMeta>;
  InAppNotificationSearchInput: InAppNotificationSearchInput;
  InAppNotificationSearchResult: ResolverTypeWrapper<InAppNotificationSearchResult>;
  InAppNotifications: ResolverTypeWrapper<InAppNotifications>;
  IncidentForm: ResolverTypeWrapper<IncidentForm>;
  IncidentFormResponse: ResolverTypeWrapper<IncidentFormResponse>;
  IncidentFormSearchInput: IncidentFormSearchInput;
  IncidentFormSearchResult: ResolverTypeWrapper<IncidentFormSearchResult>;
  IncidentFormStatus: IncidentFormStatus;
  InputAdminResetPassword: InputAdminResetPassword;
  InputAvailabilityTime: InputAvailabilityTime;
  InputBrowserNotificationKeys: InputBrowserNotificationKeys;
  InputBrowserNotificationSubscription: InputBrowserNotificationSubscription;
  InputDayAvailability: InputDayAvailability;
  InputEventRequestDetails: InputEventRequestDetails;
  InputUserAvailability: InputUserAvailability;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  InterestListSetting: ResolverTypeWrapper<InterestListSetting>;
  InviteMember: InviteMember;
  InviteUser: InviteUser;
  LotteryCounter: ResolverTypeWrapper<LotteryCounter>;
  LotteryCounterSearchResult: ResolverTypeWrapper<LotteryCounterSearchResult>;
  LotteryDate: ResolverTypeWrapper<LotteryDate>;
  LotterySettings: ResolverTypeWrapper<LotterySettings>;
  LottoAnalytics: ResolverTypeWrapper<LottoAnalytics>;
  LottoRequests: ResolverTypeWrapper<LottoRequests>;
  Member: ResolverTypeWrapper<Member>;
  MemberEquipment: ResolverTypeWrapper<MemberEquipment>;
  MemberEquipmentAttachmentUpload: ResolverTypeWrapper<MemberEquipmentAttachmentUpload>;
  MemberEquipmentSearchInput: MemberEquipmentSearchInput;
  MemberEquipmentSearchResult: ResolverTypeWrapper<MemberEquipmentSearchResult>;
  MemberNotification: ResolverTypeWrapper<MemberNotification>;
  MemberRole: MemberRole;
  MemberSkill: ResolverTypeWrapper<MemberSkill>;
  MemberSkillAttachmentUpload: ResolverTypeWrapper<MemberSkillAttachmentUpload>;
  MemberSkillSearchInput: MemberSkillSearchInput;
  MemberSkillSearchResult: ResolverTypeWrapper<MemberSkillSearchResult>;
  MemberStatus: MemberStatus;
  MemberTier: MemberTier;
  MissionAssignments: ResolverTypeWrapper<MissionAssignments>;
  Mutation: ResolverTypeWrapper<{}>;
  NewContactInfo: NewContactInfo;
  NewEmail: NewEmail;
  NewMember: NewMember;
  NewPhone: NewPhone;
  NewUser: NewUser;
  Notification: ResolverTypeWrapper<Notification>;
  NotificationFrequency: NotificationFrequency;
  NotificationSearchInput: NotificationSearchInput;
  NotificationSearchResult: ResolverTypeWrapper<NotificationSearchResult>;
  ObjectId: ResolverTypeWrapper<Scalars['ObjectId']['output']>;
  OperationalPeriod: ResolverTypeWrapper<OperationalPeriod>;
  Organization: ResolverTypeWrapper<Organization>;
  OrganizationContact: ResolverTypeWrapper<OrganizationContact>;
  OrganizationCustomizations: ResolverTypeWrapper<OrganizationCustomizations>;
  OrganizationCustomizationsTier: ResolverTypeWrapper<OrganizationCustomizationsTier>;
  OrganizationCustomizationsTiers: ResolverTypeWrapper<OrganizationCustomizationsTiers>;
  OrganizationDateFormats: ResolverTypeWrapper<OrganizationDateFormats>;
  OrganizationFeatureOptions: ResolverTypeWrapper<OrganizationFeatureOptions>;
  OrganizationFeatures: ResolverTypeWrapper<OrganizationFeatures>;
  OrganizationOvertimeSettings: ResolverTypeWrapper<OrganizationOvertimeSettings>;
  OrganizationSSOSettings: ResolverTypeWrapper<OrganizationSsoSettings>;
  OrganizationSearchInput: OrganizationSearchInput;
  OrganizationSearchResult: ResolverTypeWrapper<OrganizationSearchResult>;
  OutsideUser: ResolverTypeWrapper<OutsideUser>;
  OutsideUserSearchResult: ResolverTypeWrapper<OutsideUserSearchResult>;
  Phone: ResolverTypeWrapper<Phone>;
  ProfilePhotoAttachmentUpload: ResolverTypeWrapper<ProfilePhotoAttachmentUpload>;
  Query: ResolverTypeWrapper<{}>;
  Rank: ResolverTypeWrapper<Rank>;
  RankGroup: ResolverTypeWrapper<RankGroup>;
  RankGroupSearchInput: RankGroupSearchInput;
  RankGroupSearchResult: ResolverTypeWrapper<RankGroupSearchResult>;
  RankSearchInput: RankSearchInput;
  RankSearchResult: ResolverTypeWrapper<RankSearchResult>;
  SearchDateFilter: SearchDateFilter;
  SearchInput: SearchInput;
  SearchTimeFilter: SearchTimeFilter;
  SearchTimeRange: SearchTimeRange;
  Shift: ResolverTypeWrapper<Shift>;
  ShiftAdminCheckInOutEvent: ShiftAdminCheckInOutEvent;
  ShiftAvailabilityTime: ResolverTypeWrapper<ShiftAvailabilityTime>;
  ShiftBuffer: ResolverTypeWrapper<ShiftBuffer>;
  ShiftBufferRequest: ResolverTypeWrapper<ShiftBufferRequest>;
  ShiftBufferRequestStatus: ShiftBufferRequestStatus;
  ShiftBufferRequestsSearchInput: ShiftBufferRequestsSearchInput;
  ShiftBufferRequestsSearchResult: ResolverTypeWrapper<ShiftBufferRequestsSearchResult>;
  ShiftCheckInOut: ResolverTypeWrapper<ShiftCheckInOut>;
  ShiftCheckInOutCoordinates: ResolverTypeWrapper<ShiftCheckInOutCoordinates>;
  ShiftCheckInOutEquipment: ResolverTypeWrapper<ShiftCheckInOutEquipment>;
  ShiftCheckInOutEquipmentEvent: ShiftCheckInOutEquipmentEvent;
  ShiftCheckInOutEvent: ShiftCheckInOutEvent;
  ShiftCheckOutResponse: ResolverTypeWrapper<ShiftCheckOutResponse>;
  ShiftDayTime: ResolverTypeWrapper<ShiftDayTime>;
  ShiftDetails: ResolverTypeWrapper<ShiftDetails>;
  ShiftInterestRequest: ResolverTypeWrapper<ShiftInterestRequest>;
  ShiftInterestRequestStatus: ShiftInterestRequestStatus;
  ShiftInterestRequestsSearchInput: ShiftInterestRequestsSearchInput;
  ShiftInterestRequestsSearchResult: ResolverTypeWrapper<ShiftInterestRequestsSearchResult>;
  ShiftLotteryRequest: ResolverTypeWrapper<ShiftLotteryRequest>;
  ShiftLotteryRequestStatus: ShiftLotteryRequestStatus;
  ShiftLotteryRequestsSearchInput: ShiftLotteryRequestsSearchInput;
  ShiftLotteryRequestsSearchResult: ResolverTypeWrapper<ShiftLotteryRequestsSearchResult>;
  ShiftLottoRequestsSearchInput: ShiftLottoRequestsSearchInput;
  ShiftReminder: ResolverTypeWrapper<ShiftReminder>;
  ShiftReminderUnit: ShiftReminderUnit;
  ShiftSearchInput: ShiftSearchInput;
  ShiftSearchResult: ResolverTypeWrapper<ShiftSearchResult>;
  ShiftStatus: ShiftStatus;
  ShiftTabResponse: ResolverTypeWrapper<ShiftTabResponse>;
  ShiftUpdates: ShiftUpdates;
  SiteLock: ResolverTypeWrapper<SiteLock>;
  Skill: ResolverTypeWrapper<Skill>;
  SkillSearchInput: SkillSearchInput;
  SkillSearchResult: ResolverTypeWrapper<SkillSearchResult>;
  SkillStatus: SkillStatus;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Timekeeping: ResolverTypeWrapper<Timekeeping>;
  TimekeepingType: TimekeepingType;
  Unit: ResolverTypeWrapper<Unit>;
  UnitSearchInput: UnitSearchInput;
  UnitSearchResult: ResolverTypeWrapper<UnitSearchResult>;
  UpdateUser: UpdateUser;
  UpsertAfterShiftRemove: UpsertAfterShiftRemove;
  UpsertAssignment: UpsertAssignment;
  UpsertAssignmentShiftSlot: UpsertAssignmentShiftSlot;
  UpsertCheckInOutSetting: UpsertCheckInOutSetting;
  UpsertDivision: UpsertDivision;
  UpsertEquipment: UpsertEquipment;
  UpsertEvent: UpsertEvent;
  UpsertInterestListSetting: UpsertInterestListSetting;
  UpsertLotteryDate: UpsertLotteryDate;
  UpsertLotterySettings: UpsertLotterySettings;
  UpsertMemberEquipment: UpsertMemberEquipment;
  UpsertMemberSkill: UpsertMemberSkill;
  UpsertNotification: UpsertNotification;
  UpsertOrganization: UpsertOrganization;
  UpsertOrganizationContact: UpsertOrganizationContact;
  UpsertOrganizationCustomizations: UpsertOrganizationCustomizations;
  UpsertOrganizationCustomizationsTier: UpsertOrganizationCustomizationsTier;
  UpsertOrganizationCustomizationsTiers: UpsertOrganizationCustomizationsTiers;
  UpsertOrganizationFeatures: UpsertOrganizationFeatures;
  UpsertOrganizationOvertimeSettings: UpsertOrganizationOvertimeSettings;
  UpsertOrganizationSSOSettings: UpsertOrganizationSsoSettings;
  UpsertRank: UpsertRank;
  UpsertRankGroup: UpsertRankGroup;
  UpsertShift: UpsertShift;
  UpsertShiftBuffer: UpsertShiftBuffer;
  UpsertShiftInterestRequest: UpsertShiftInterestRequest;
  UpsertShiftLotteryRequest: UpsertShiftLotteryRequest;
  UpsertShiftReminder: UpsertShiftReminder;
  UpsertSiteLock: UpsertSiteLock;
  UpsertSkill: UpsertSkill;
  UpsertUnit: UpsertUnit;
  UpsertUserRelinquishShift: UpsertUserRelinquishShift;
  UpsertVehicleCategories: UpsertVehicleCategories;
  UpsertVenue: UpsertVenue;
  UpsertVenueContact: UpsertVenueContact;
  UpsertVenueContract: UpsertVenueContract;
  User: ResolverTypeWrapper<User>;
  UserAvailability: ResolverTypeWrapper<UserAvailability>;
  UserRelinquishShift: ResolverTypeWrapper<UserRelinquishShift>;
  UserSearchInput: UserSearchInput;
  UserSearchResult: ResolverTypeWrapper<UserSearchResult>;
  VehicleCategories: ResolverTypeWrapper<VehicleCategories>;
  VehicleCategoriesSearchInput: VehicleCategoriesSearchInput;
  VehicleCategoriesSearchResult: ResolverTypeWrapper<VehicleCategoriesSearchResult>;
  VehicleInformation: ResolverTypeWrapper<VehicleInformation>;
  Venue: ResolverTypeWrapper<Venue>;
  VenueContact: ResolverTypeWrapper<VenueContact>;
  VenueContract: ResolverTypeWrapper<VenueContract>;
  VenueSearchInput: VenueSearchInput;
  VenueSearchResult: ResolverTypeWrapper<VenueSearchResult>;
  VenueStatus: VenueStatus;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  ActivityLog: ActivityLog;
  ActivityLogEntry: ActivityLogEntry;
  AfterShiftRemove: AfterShiftRemove;
  AllUsersSearchInput: AllUsersSearchInput;
  Assignment: Assignment;
  AssignmentSearchInput: AssignmentSearchInput;
  AssignmentSearchResult: AssignmentSearchResult;
  AssignmentShiftSlot: AssignmentShiftSlot;
  AssignmentSummary: AssignmentSummary;
  AvailabilityTime: AvailabilityTime;
  AvailableShiftsSearchInput: AvailableShiftsSearchInput;
  Boolean: Scalars['Boolean']['output'];
  BrowserNotificationKeys: BrowserNotificationKeys;
  BrowserNotificationSetting: BrowserNotificationSetting;
  BrowserNotificationSubscription: BrowserNotificationSubscription;
  CheckInOutCoordinates: CheckInOutCoordinates;
  CheckInOutSetting: CheckInOutSetting;
  ContactInfo: ContactInfo;
  CreateOrganization: CreateOrganization;
  CreateOutsideUser: CreateOutsideUser;
  CreateShiftBufferRequest: CreateShiftBufferRequest;
  Date: Scalars['Date']['output'];
  DateTime: Scalars['DateTime']['output'];
  DayAvailability: DayAvailability;
  Division: Division;
  DivisionSearchInput: DivisionSearchInput;
  DivisionSearchResult: DivisionSearchResult;
  DocusignEvent: DocusignEvent;
  DocusignEventSearchInput: DocusignEventSearchInput;
  DocusignEventSearchResult: DocusignEventSearchResult;
  DocusignSettings: DocusignSettings;
  DocusignSignerDetails: DocusignSignerDetails;
  DocusignSignerDetailsData: DocusignSignerDetailsData;
  Email: Email;
  Equipment: Equipment;
  EquipmentSearchInput: EquipmentSearchInput;
  EquipmentSearchResult: EquipmentSearchResult;
  Event: Event;
  EventAttachmentUpload: EventAttachmentUpload;
  EventInvoiceResponse: EventInvoiceResponse;
  EventRequestDetails: EventRequestDetails;
  EventSearchInput: EventSearchInput;
  EventSearchResult: EventSearchResult;
  FinanceShift: FinanceShift;
  FinanceShiftSearchInput: FinanceShiftSearchInput;
  Float: Scalars['Float']['output'];
  IActivityLog: IActivityLog;
  IActivityLogEntry: IActivityLogEntry;
  IAssignmentSummary: IAssignmentSummary;
  ID: Scalars['ID']['output'];
  IIncidentForm: IIncidentForm;
  IMissionAssignments: IMissionAssignments;
  IOperationalPeriod: IOperationalPeriod;
  IShiftDetails: IShiftDetails;
  ITimekeeping: ITimekeeping;
  IVehicleInformation: IVehicleInformation;
  InAppNotificationMeta: InAppNotificationMeta;
  InAppNotificationSearchInput: InAppNotificationSearchInput;
  InAppNotificationSearchResult: InAppNotificationSearchResult;
  InAppNotifications: InAppNotifications;
  IncidentForm: IncidentForm;
  IncidentFormResponse: IncidentFormResponse;
  IncidentFormSearchInput: IncidentFormSearchInput;
  IncidentFormSearchResult: IncidentFormSearchResult;
  InputAdminResetPassword: InputAdminResetPassword;
  InputAvailabilityTime: InputAvailabilityTime;
  InputBrowserNotificationKeys: InputBrowserNotificationKeys;
  InputBrowserNotificationSubscription: InputBrowserNotificationSubscription;
  InputDayAvailability: InputDayAvailability;
  InputEventRequestDetails: InputEventRequestDetails;
  InputUserAvailability: InputUserAvailability;
  Int: Scalars['Int']['output'];
  InterestListSetting: InterestListSetting;
  InviteMember: InviteMember;
  InviteUser: InviteUser;
  LotteryCounter: LotteryCounter;
  LotteryCounterSearchResult: LotteryCounterSearchResult;
  LotteryDate: LotteryDate;
  LotterySettings: LotterySettings;
  LottoAnalytics: LottoAnalytics;
  LottoRequests: LottoRequests;
  Member: Member;
  MemberEquipment: MemberEquipment;
  MemberEquipmentAttachmentUpload: MemberEquipmentAttachmentUpload;
  MemberEquipmentSearchInput: MemberEquipmentSearchInput;
  MemberEquipmentSearchResult: MemberEquipmentSearchResult;
  MemberNotification: MemberNotification;
  MemberSkill: MemberSkill;
  MemberSkillAttachmentUpload: MemberSkillAttachmentUpload;
  MemberSkillSearchInput: MemberSkillSearchInput;
  MemberSkillSearchResult: MemberSkillSearchResult;
  MissionAssignments: MissionAssignments;
  Mutation: {};
  NewContactInfo: NewContactInfo;
  NewEmail: NewEmail;
  NewMember: NewMember;
  NewPhone: NewPhone;
  NewUser: NewUser;
  Notification: Notification;
  NotificationSearchInput: NotificationSearchInput;
  NotificationSearchResult: NotificationSearchResult;
  ObjectId: Scalars['ObjectId']['output'];
  OperationalPeriod: OperationalPeriod;
  Organization: Organization;
  OrganizationContact: OrganizationContact;
  OrganizationCustomizations: OrganizationCustomizations;
  OrganizationCustomizationsTier: OrganizationCustomizationsTier;
  OrganizationCustomizationsTiers: OrganizationCustomizationsTiers;
  OrganizationDateFormats: OrganizationDateFormats;
  OrganizationFeatureOptions: OrganizationFeatureOptions;
  OrganizationFeatures: OrganizationFeatures;
  OrganizationOvertimeSettings: OrganizationOvertimeSettings;
  OrganizationSSOSettings: OrganizationSsoSettings;
  OrganizationSearchInput: OrganizationSearchInput;
  OrganizationSearchResult: OrganizationSearchResult;
  OutsideUser: OutsideUser;
  OutsideUserSearchResult: OutsideUserSearchResult;
  Phone: Phone;
  ProfilePhotoAttachmentUpload: ProfilePhotoAttachmentUpload;
  Query: {};
  Rank: Rank;
  RankGroup: RankGroup;
  RankGroupSearchInput: RankGroupSearchInput;
  RankGroupSearchResult: RankGroupSearchResult;
  RankSearchInput: RankSearchInput;
  RankSearchResult: RankSearchResult;
  SearchDateFilter: SearchDateFilter;
  SearchInput: SearchInput;
  SearchTimeFilter: SearchTimeFilter;
  SearchTimeRange: SearchTimeRange;
  Shift: Shift;
  ShiftAdminCheckInOutEvent: ShiftAdminCheckInOutEvent;
  ShiftAvailabilityTime: ShiftAvailabilityTime;
  ShiftBuffer: ShiftBuffer;
  ShiftBufferRequest: ShiftBufferRequest;
  ShiftBufferRequestsSearchInput: ShiftBufferRequestsSearchInput;
  ShiftBufferRequestsSearchResult: ShiftBufferRequestsSearchResult;
  ShiftCheckInOut: ShiftCheckInOut;
  ShiftCheckInOutCoordinates: ShiftCheckInOutCoordinates;
  ShiftCheckInOutEquipment: ShiftCheckInOutEquipment;
  ShiftCheckInOutEquipmentEvent: ShiftCheckInOutEquipmentEvent;
  ShiftCheckInOutEvent: ShiftCheckInOutEvent;
  ShiftCheckOutResponse: ShiftCheckOutResponse;
  ShiftDayTime: ShiftDayTime;
  ShiftDetails: ShiftDetails;
  ShiftInterestRequest: ShiftInterestRequest;
  ShiftInterestRequestsSearchInput: ShiftInterestRequestsSearchInput;
  ShiftInterestRequestsSearchResult: ShiftInterestRequestsSearchResult;
  ShiftLotteryRequest: ShiftLotteryRequest;
  ShiftLotteryRequestsSearchInput: ShiftLotteryRequestsSearchInput;
  ShiftLotteryRequestsSearchResult: ShiftLotteryRequestsSearchResult;
  ShiftLottoRequestsSearchInput: ShiftLottoRequestsSearchInput;
  ShiftReminder: ShiftReminder;
  ShiftSearchInput: ShiftSearchInput;
  ShiftSearchResult: ShiftSearchResult;
  ShiftTabResponse: ShiftTabResponse;
  ShiftUpdates: ShiftUpdates;
  SiteLock: SiteLock;
  Skill: Skill;
  SkillSearchInput: SkillSearchInput;
  SkillSearchResult: SkillSearchResult;
  String: Scalars['String']['output'];
  Timekeeping: Timekeeping;
  Unit: Unit;
  UnitSearchInput: UnitSearchInput;
  UnitSearchResult: UnitSearchResult;
  UpdateUser: UpdateUser;
  UpsertAfterShiftRemove: UpsertAfterShiftRemove;
  UpsertAssignment: UpsertAssignment;
  UpsertAssignmentShiftSlot: UpsertAssignmentShiftSlot;
  UpsertCheckInOutSetting: UpsertCheckInOutSetting;
  UpsertDivision: UpsertDivision;
  UpsertEquipment: UpsertEquipment;
  UpsertEvent: UpsertEvent;
  UpsertInterestListSetting: UpsertInterestListSetting;
  UpsertLotteryDate: UpsertLotteryDate;
  UpsertLotterySettings: UpsertLotterySettings;
  UpsertMemberEquipment: UpsertMemberEquipment;
  UpsertMemberSkill: UpsertMemberSkill;
  UpsertNotification: UpsertNotification;
  UpsertOrganization: UpsertOrganization;
  UpsertOrganizationContact: UpsertOrganizationContact;
  UpsertOrganizationCustomizations: UpsertOrganizationCustomizations;
  UpsertOrganizationCustomizationsTier: UpsertOrganizationCustomizationsTier;
  UpsertOrganizationCustomizationsTiers: UpsertOrganizationCustomizationsTiers;
  UpsertOrganizationFeatures: UpsertOrganizationFeatures;
  UpsertOrganizationOvertimeSettings: UpsertOrganizationOvertimeSettings;
  UpsertOrganizationSSOSettings: UpsertOrganizationSsoSettings;
  UpsertRank: UpsertRank;
  UpsertRankGroup: UpsertRankGroup;
  UpsertShift: UpsertShift;
  UpsertShiftBuffer: UpsertShiftBuffer;
  UpsertShiftInterestRequest: UpsertShiftInterestRequest;
  UpsertShiftLotteryRequest: UpsertShiftLotteryRequest;
  UpsertShiftReminder: UpsertShiftReminder;
  UpsertSiteLock: UpsertSiteLock;
  UpsertSkill: UpsertSkill;
  UpsertUnit: UpsertUnit;
  UpsertUserRelinquishShift: UpsertUserRelinquishShift;
  UpsertVehicleCategories: UpsertVehicleCategories;
  UpsertVenue: UpsertVenue;
  UpsertVenueContact: UpsertVenueContact;
  UpsertVenueContract: UpsertVenueContract;
  User: User;
  UserAvailability: UserAvailability;
  UserRelinquishShift: UserRelinquishShift;
  UserSearchInput: UserSearchInput;
  UserSearchResult: UserSearchResult;
  VehicleCategories: VehicleCategories;
  VehicleCategoriesSearchInput: VehicleCategoriesSearchInput;
  VehicleCategoriesSearchResult: VehicleCategoriesSearchResult;
  VehicleInformation: VehicleInformation;
  Venue: Venue;
  VenueContact: VenueContact;
  VenueContract: VenueContract;
  VenueSearchInput: VenueSearchInput;
  VenueSearchResult: VenueSearchResult;
}>;

export type ActivityLogResolvers<ContextType = any, ParentType extends ResolversParentTypes['ActivityLog'] = ResolversParentTypes['ActivityLog']> = ResolversObject<{
  entries?: Resolver<Maybe<Array<Maybe<ResolversTypes['ActivityLogEntry']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ActivityLogEntryResolvers<ContextType = any, ParentType extends ResolversParentTypes['ActivityLogEntry'] = ResolversParentTypes['ActivityLogEntry']> = ResolversObject<{
  missionNumber?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  notes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  time?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AfterShiftRemoveResolvers<ContextType = any, ParentType extends ResolversParentTypes['AfterShiftRemove'] = ResolversParentTypes['AfterShiftRemove']> = ResolversObject<{
  days?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  tier?: Resolver<ResolversTypes['MemberTier'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AssignmentResolvers<ContextType = any, ParentType extends ResolversParentTypes['Assignment'] = ResolversParentTypes['Assignment']> = ResolversObject<{
  availableShifts?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  bwNeeded?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  callSign?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  event?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  eventId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isSigningAuthority?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  lieutenant?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  lieutenantAssignment?: Resolver<Maybe<ResolversTypes['Assignment']>, ParentType, ContextType>;
  lieutenantAssignmentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lieutenantId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notifyWhenFullyStaffed?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rankIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  ranks?: Resolver<Maybe<Array<Maybe<ResolversTypes['Rank']>>>, ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  reportingLocation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  requiredEquipment?: Resolver<Maybe<Array<Maybe<ResolversTypes['Equipment']>>>, ParentType, ContextType>;
  requiredEquipmentIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  requiredSkillIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  requiredSkills?: Resolver<Maybe<Array<Maybe<ResolversTypes['Skill']>>>, ParentType, ContextType>;
  shiftIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  shiftSlots?: Resolver<Maybe<Array<Maybe<ResolversTypes['AssignmentShiftSlot']>>>, ParentType, ContextType>;
  shifts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Shift']>>>, ParentType, ContextType>;
  supervisor?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  supervisorAssignment?: Resolver<Maybe<ResolversTypes['Assignment']>, ParentType, ContextType>;
  supervisorAssignmentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  supervisorId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  totalShifts?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AssignmentSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['AssignmentSearchResult'] = ResolversParentTypes['AssignmentSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Assignment']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AssignmentShiftSlotResolvers<ContextType = any, ParentType extends ResolversParentTypes['AssignmentShiftSlot'] = ResolversParentTypes['AssignmentShiftSlot']> = ResolversObject<{
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  slotCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AssignmentSummaryResolvers<ContextType = any, ParentType extends ResolversParentTypes['AssignmentSummary'] = ResolversParentTypes['AssignmentSummary']> = ResolversObject<{
  callSign?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  missionAssignments?: Resolver<Maybe<ResolversTypes['MissionAssignments']>, ParentType, ContextType>;
  otherExplanation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  squad?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  supervisor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AvailabilityTimeResolvers<ContextType = any, ParentType extends ResolversParentTypes['AvailabilityTime'] = ResolversParentTypes['AvailabilityTime']> = ResolversObject<{
  endTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BrowserNotificationKeysResolvers<ContextType = any, ParentType extends ResolversParentTypes['BrowserNotificationKeys'] = ResolversParentTypes['BrowserNotificationKeys']> = ResolversObject<{
  auth?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  p256dh?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BrowserNotificationSettingResolvers<ContextType = any, ParentType extends ResolversParentTypes['BrowserNotificationSetting'] = ResolversParentTypes['BrowserNotificationSetting']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  org?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  subscription?: Resolver<ResolversTypes['BrowserNotificationSubscription'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BrowserNotificationSubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['BrowserNotificationSubscription'] = ResolversParentTypes['BrowserNotificationSubscription']> = ResolversObject<{
  endpoint?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  expirationTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  keys?: Resolver<ResolversTypes['BrowserNotificationKeys'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CheckInOutSettingResolvers<ContextType = any, ParentType extends ResolversParentTypes['CheckInOutSetting'] = ResolversParentTypes['CheckInOutSetting']> = ResolversObject<{
  minutesAfterShiftEnd?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  minutesBeforeShiftStart?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ContactInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContactInfo'] = ResolversParentTypes['ContactInfo']> = ResolversObject<{
  primaryEmail?: Resolver<ResolversTypes['Email'], ParentType, ContextType>;
  primaryPhone?: Resolver<Maybe<ResolversTypes['Phone']>, ParentType, ContextType>;
  secondaryEmail?: Resolver<Maybe<ResolversTypes['Email']>, ParentType, ContextType>;
  secondaryPhone?: Resolver<Maybe<ResolversTypes['Phone']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DayAvailabilityResolvers<ContextType = any, ParentType extends ResolversParentTypes['DayAvailability'] = ResolversParentTypes['DayAvailability']> = ResolversObject<{
  available?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  times?: Resolver<Maybe<Array<ResolversTypes['AvailabilityTime']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DivisionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Division'] = ResolversParentTypes['Division']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  org?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DivisionSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['DivisionSearchResult'] = ResolversParentTypes['DivisionSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Division']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DocusignEventResolvers<ContextType = any, ParentType extends ResolversParentTypes['DocusignEvent'] = ResolversParentTypes['DocusignEvent']> = ResolversObject<{
  assignmentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  documentUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  documentUrls?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  envelopeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  eventId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lieutenantId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shift?: Resolver<Maybe<ResolversTypes['Shift']>, ParentType, ContextType>;
  shiftId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  signerDetails?: Resolver<Maybe<Array<ResolversTypes['DocusignSignerDetails']>>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  supervisorId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DocusignEventSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['DocusignEventSearchResult'] = ResolversParentTypes['DocusignEventSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['DocusignEvent']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DocusignSettingsResolvers<ContextType = any, ParentType extends ResolversParentTypes['DocusignSettings'] = ResolversParentTypes['DocusignSettings']> = ResolversObject<{
  templateId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DocusignSignerDetailsResolvers<ContextType = any, ParentType extends ResolversParentTypes['DocusignSignerDetails'] = ResolversParentTypes['DocusignSignerDetails']> = ResolversObject<{
  data?: Resolver<Maybe<ResolversTypes['DocusignSignerDetailsData']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  roleName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  routingOrder?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DocusignSignerDetailsDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['DocusignSignerDetailsData'] = ResolversParentTypes['DocusignSignerDetailsData']> = ResolversObject<{
  callSign?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  endingMilage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  officerShiftTimeIn?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  officerShiftTimeOut?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  startingMilage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  totalMilage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  vehicleMake?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  vehicleModel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  vehicleNumber?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailResolvers<ContextType = any, ParentType extends ResolversParentTypes['Email'] = ResolversParentTypes['Email']> = ResolversObject<{
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  receiveEmails?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EquipmentResolvers<ContextType = any, ParentType extends ResolversParentTypes['Equipment'] = ResolversParentTypes['Equipment']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rankOnlyIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  ranksOnly?: Resolver<Maybe<Array<Maybe<ResolversTypes['Rank']>>>, ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  requiresAdminApproval?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  requiresCert?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  requiresEquipmentTime?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  requiresVehicleInformation?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EquipmentSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['EquipmentSearchResult'] = ResolversParentTypes['EquipmentSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Equipment']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventResolvers<ContextType = any, ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']> = ResolversObject<{
  assignmentIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  assignments?: Resolver<Maybe<Array<ResolversTypes['Assignment']>>, ParentType, ContextType>;
  attachmentPaths?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  attachments?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  autoAssignInterestList?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  availableShifts?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  budgetActivityCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  callSign?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  createdById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  docusignEnvelopeId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  docusignEnvelopeStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  docusignEvent?: Resolver<Maybe<ResolversTypes['DocusignEvent']>, ParentType, ContextType>;
  endTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  interestListAutoAssignCutoff?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  interestListTransition?: Resolver<Maybe<ResolversTypes['EventStatus']>, ParentType, ContextType>;
  lieutenant?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  lieutenantId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lotteryCounter?: Resolver<Maybe<ResolversTypes['LotteryCounter']>, ParentType, ContextType>;
  lotteryNumber?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  notifyOnFirstComeFirstServe?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  notifyWhenFullyStaffed?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  ocn?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  outsideOrgCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  overtimeReasonCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  referenceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  requestDetails?: Resolver<Maybe<ResolversTypes['EventRequestDetails']>, ParentType, ContextType>;
  requiredSkillIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  requiredSkills?: Resolver<Maybe<Array<Maybe<ResolversTypes['Skill']>>>, ParentType, ContextType>;
  scheduledCloseInterestList?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  scheduledFirstComeFirstServe?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  scheduledInterestList?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  searchAttribute?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['EventStatus'], ParentType, ContextType>;
  supervisor?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  supervisorId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  totalShifts?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  venue?: Resolver<Maybe<ResolversTypes['Venue']>, ParentType, ContextType>;
  venueId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventAttachmentUploadResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventAttachmentUpload'] = ResolversParentTypes['EventAttachmentUpload']> = ResolversObject<{
  attachmentPath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uploadUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventInvoiceResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventInvoiceResponse'] = ResolversParentTypes['EventInvoiceResponse']> = ResolversObject<{
  signingUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventRequestDetailsResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventRequestDetails'] = ResolversParentTypes['EventRequestDetails']> = ResolversObject<{
  adminNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  endTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  estimatedAttendees?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  newVenue?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  numberOfOfficers?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  requestorEmail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  startTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventSearchResult'] = ResolversParentTypes['EventSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FinanceShiftResolvers<ContextType = any, ParentType extends ResolversParentTypes['FinanceShift'] = ResolversParentTypes['FinanceShift']> = ResolversObject<{
  division?: Resolver<Maybe<ResolversTypes['Division']>, ParentType, ContextType>;
  docusignEvent?: Resolver<Maybe<ResolversTypes['DocusignEvent']>, ParentType, ContextType>;
  endTime?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  rank?: Resolver<Maybe<ResolversTypes['Rank']>, ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  totalOvertimeHours?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  totalStraightHours?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  totalVehicleMilage?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  unit?: Resolver<Maybe<ResolversTypes['Unit']>, ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  vehicleCategory?: Resolver<Maybe<ResolversTypes['VehicleCategories']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InAppNotificationMetaResolvers<ContextType = any, ParentType extends ResolversParentTypes['InAppNotificationMeta'] = ResolversParentTypes['InAppNotificationMeta']> = ResolversObject<{
  assignmentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  eventId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rankId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shiftBufferRequestId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shiftId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  skillId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  venueId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InAppNotificationSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['InAppNotificationSearchResult'] = ResolversParentTypes['InAppNotificationSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['InAppNotifications']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unreadCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InAppNotificationsResolvers<ContextType = any, ParentType extends ResolversParentTypes['InAppNotifications'] = ResolversParentTypes['InAppNotifications']> = ResolversObject<{
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  meta?: Resolver<Maybe<ResolversTypes['InAppNotificationMeta']>, ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  read?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  templateName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type IncidentFormResolvers<ContextType = any, ParentType extends ResolversParentTypes['IncidentForm'] = ResolversParentTypes['IncidentForm']> = ResolversObject<{
  activityLog?: Resolver<ResolversTypes['ActivityLog'], ParentType, ContextType>;
  assignmentSummary?: Resolver<ResolversTypes['AssignmentSummary'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docusignEvent?: Resolver<Maybe<ResolversTypes['DocusignEvent']>, ParentType, ContextType>;
  envelopeId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  event?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  eventId?: Resolver<ResolversTypes['ObjectId'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  modifiedById?: Resolver<ResolversTypes['ObjectId'], ParentType, ContextType>;
  operationalPeriod?: Resolver<ResolversTypes['OperationalPeriod'], ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['ObjectId'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  reviewer?: Resolver<ResolversTypes['ObjectId'], ParentType, ContextType>;
  reviewerUser?: Resolver<Maybe<ResolversTypes['OutsideUser']>, ParentType, ContextType>;
  shiftDetails?: Resolver<ResolversTypes['ShiftDetails'], ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['IncidentFormStatus']>, ParentType, ContextType>;
  step?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  submittedDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  timekeeping?: Resolver<ResolversTypes['Timekeeping'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ObjectId'], ParentType, ContextType>;
  vehicleInformation?: Resolver<ResolversTypes['VehicleInformation'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type IncidentFormResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['IncidentFormResponse'] = ResolversParentTypes['IncidentFormResponse']> = ResolversObject<{
  incidentForm?: Resolver<ResolversTypes['IncidentForm'], ParentType, ContextType>;
  signingUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type IncidentFormSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['IncidentFormSearchResult'] = ResolversParentTypes['IncidentFormSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<ResolversTypes['IncidentForm']>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type InterestListSettingResolvers<ContextType = any, ParentType extends ResolversParentTypes['InterestListSetting'] = ResolversParentTypes['InterestListSetting']> = ResolversObject<{
  defaultAutoHireCutoff?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  defaultHoursBeforeShift?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  defaultNotificationTime?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LotteryCounterResolvers<ContextType = any, ParentType extends ResolversParentTypes['LotteryCounter'] = ResolversParentTypes['LotteryCounter']> = ResolversObject<{
  counter?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  end?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  start?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LotteryCounterSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['LotteryCounterSearchResult'] = ResolversParentTypes['LotteryCounterSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['LotteryCounter']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LotteryDateResolvers<ContextType = any, ParentType extends ResolversParentTypes['LotteryDate'] = ResolversParentTypes['LotteryDate']> = ResolversObject<{
  dayOfWeek?: Resolver<ResolversTypes['DayOfWeek'], ParentType, ContextType>;
  time?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LotterySettingsResolvers<ContextType = any, ParentType extends ResolversParentTypes['LotterySettings'] = ResolversParentTypes['LotterySettings']> = ResolversObject<{
  close?: Resolver<ResolversTypes['LotteryDate'], ParentType, ContextType>;
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  fcfsShiftsDelay?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  notifyUsersBeforeClose?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  open?: Resolver<ResolversTypes['LotteryDate'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LottoAnalyticsResolvers<ContextType = any, ParentType extends ResolversParentTypes['LottoAnalytics'] = ResolversParentTypes['LottoAnalytics']> = ResolversObject<{
  approved?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lotteryCounter?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  org?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  rejected?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  requests?: Resolver<Maybe<Array<Maybe<ResolversTypes['LottoRequests']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalShifts?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalUnassignedShifts?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LottoRequestsResolvers<ContextType = any, ParentType extends ResolversParentTypes['LottoRequests'] = ResolversParentTypes['LottoRequests']> = ResolversObject<{
  assignment?: Resolver<Maybe<ResolversTypes['Assignment']>, ParentType, ContextType>;
  assignmentId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  event?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType>;
  eventId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  shiftGroupId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ShiftLotteryRequestStatus'], ParentType, ContextType>;
  totalRequests?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MemberResolvers<ContextType = any, ParentType extends ResolversParentTypes['Member'] = ResolversParentTypes['Member']> = ResolversObject<{
  adminNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  availability?: Resolver<ResolversTypes['UserAvailability'], ParentType, ContextType>;
  contactInfo?: Resolver<Maybe<ResolversTypes['ContactInfo']>, ParentType, ContextType>;
  deactivationNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  division?: Resolver<Maybe<ResolversTypes['Division']>, ParentType, ContextType>;
  divisionId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hourlyRate?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  inactivateUntil?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  inactivationNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  incidentHourlyRate?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  maxShifts?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  memberEquipmentIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  memberEquipments?: Resolver<Maybe<Array<Maybe<ResolversTypes['MemberEquipment']>>>, ParentType, ContextType>;
  memberSkillIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  memberSkills?: Resolver<Maybe<Array<Maybe<ResolversTypes['MemberSkill']>>>, ParentType, ContextType>;
  org?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rank?: Resolver<Maybe<ResolversTypes['Rank']>, ParentType, ContextType>;
  rankId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  role?: Resolver<Maybe<ResolversTypes['MemberRole']>, ParentType, ContextType>;
  startDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['MemberStatus']>, ParentType, ContextType>;
  tenor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tier?: Resolver<Maybe<ResolversTypes['MemberTier']>, ParentType, ContextType>;
  tierResetOnNextLottery?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  tierUntil?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  unit?: Resolver<Maybe<ResolversTypes['Unit']>, ParentType, ContextType>;
  unitId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MemberEquipmentResolvers<ContextType = any, ParentType extends ResolversParentTypes['MemberEquipment'] = ResolversParentTypes['MemberEquipment']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  equipment?: Resolver<ResolversTypes['Equipment'], ParentType, ContextType>;
  equipmentId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  imagePath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['EquipmentStatus'], ParentType, ContextType>;
  statusReason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MemberEquipmentAttachmentUploadResolvers<ContextType = any, ParentType extends ResolversParentTypes['MemberEquipmentAttachmentUpload'] = ResolversParentTypes['MemberEquipmentAttachmentUpload']> = ResolversObject<{
  imagePath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uploadUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MemberEquipmentSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['MemberEquipmentSearchResult'] = ResolversParentTypes['MemberEquipmentSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['MemberEquipment']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MemberNotificationResolvers<ContextType = any, ParentType extends ResolversParentTypes['MemberNotification'] = ResolversParentTypes['MemberNotification']> = ResolversObject<{
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastSeen?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notification?: Resolver<ResolversTypes['Notification'], ParentType, ContextType>;
  notificationId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MemberSkillResolvers<ContextType = any, ParentType extends ResolversParentTypes['MemberSkill'] = ResolversParentTypes['MemberSkill']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  imagePath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  skill?: Resolver<ResolversTypes['Skill'], ParentType, ContextType>;
  skillId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['SkillStatus'], ParentType, ContextType>;
  statusReason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MemberSkillAttachmentUploadResolvers<ContextType = any, ParentType extends ResolversParentTypes['MemberSkillAttachmentUpload'] = ResolversParentTypes['MemberSkillAttachmentUpload']> = ResolversObject<{
  imagePath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uploadUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MemberSkillSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['MemberSkillSearchResult'] = ResolversParentTypes['MemberSkillSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['MemberSkill']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MissionAssignmentsResolvers<ContextType = any, ParentType extends ResolversParentTypes['MissionAssignments'] = ResolversParentTypes['MissionAssignments']> = ResolversObject<{
  escort?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  evacuations?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  hardClosure?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  incidentManagementTeam?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  logistics?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  other?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  rovingSecurity?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  rrf?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  searchAndRescue?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  softClosure?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  welfareCheck?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  addRanksToGroup?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationAddRanksToGroupArgs, 'rankGroupId' | 'rankIds'>>;
  adminEditPassword?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationAdminEditPasswordArgs, 'input'>>;
  approveEvent?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<MutationApproveEventArgs, 'id'>>;
  approveLottoAssignment?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationApproveLottoAssignmentArgs, 'id' | 'shiftId' | 'userId'>>;
  assignment?: Resolver<Maybe<ResolversTypes['Assignment']>, ParentType, ContextType, RequireFields<MutationAssignmentArgs, 'assignment'>>;
  browserNotificationSubscription?: Resolver<Maybe<ResolversTypes['BrowserNotificationSetting']>, ParentType, ContextType, RequireFields<MutationBrowserNotificationSubscriptionArgs, 'input'>>;
  checkIn?: Resolver<ResolversTypes['Shift'], ParentType, ContextType, RequireFields<MutationCheckInArgs, 'input'>>;
  checkOut?: Resolver<ResolversTypes['ShiftCheckOutResponse'], ParentType, ContextType, RequireFields<MutationCheckOutArgs, 'input'>>;
  cloneEvent?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<MutationCloneEventArgs, 'id'>>;
  createOrganization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType, RequireFields<MutationCreateOrganizationArgs, 'organization'>>;
  division?: Resolver<Maybe<ResolversTypes['Division']>, ParentType, ContextType, RequireFields<MutationDivisionArgs, 'division'>>;
  editCheckInOut?: Resolver<ResolversTypes['Shift'], ParentType, ContextType, RequireFields<MutationEditCheckInOutArgs, 'input'>>;
  equipment?: Resolver<Maybe<ResolversTypes['Equipment']>, ParentType, ContextType, RequireFields<MutationEquipmentArgs, 'equipment'>>;
  event?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<MutationEventArgs, 'event'>>;
  eventAttachmentUploadUrl?: Resolver<Maybe<ResolversTypes['EventAttachmentUpload']>, ParentType, ContextType>;
  generateDSInvoice?: Resolver<Maybe<ResolversTypes['EventInvoiceResponse']>, ParentType, ContextType, RequireFields<MutationGenerateDsInvoiceArgs, 'eventId'>>;
  generateInvoice?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationGenerateInvoiceArgs, 'eventId'>>;
  impersonateUser?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationImpersonateUserArgs, 'userId'>>;
  incidentForm?: Resolver<ResolversTypes['IncidentFormResponse'], ParentType, ContextType, RequireFields<MutationIncidentFormArgs, 'input'>>;
  inviteUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationInviteUserArgs, 'user'>>;
  newUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationNewUserArgs, 'user'>>;
  notification?: Resolver<Maybe<ResolversTypes['Notification']>, ParentType, ContextType, RequireFields<MutationNotificationArgs, 'notification'>>;
  notifyUsersOfEvent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationNotifyUsersOfEventArgs, 'eventId'>>;
  notifyUsersOfShift?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationNotifyUsersOfShiftArgs, 'shiftId'>>;
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType, RequireFields<MutationOrganizationArgs, 'organization'>>;
  outsideUsers?: Resolver<Array<ResolversTypes['OutsideUser']>, ParentType, ContextType, RequireFields<MutationOutsideUsersArgs, 'users'>>;
  partialShiftUpdate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationPartialShiftUpdateArgs, 'shiftId' | 'updates'>>;
  profilePhotoUploadUrl?: Resolver<Maybe<ResolversTypes['ProfilePhotoAttachmentUpload']>, ParentType, ContextType>;
  rank?: Resolver<Maybe<ResolversTypes['Rank']>, ParentType, ContextType, RequireFields<MutationRankArgs, 'rank'>>;
  rankGroup?: Resolver<Maybe<ResolversTypes['RankGroup']>, ParentType, ContextType, RequireFields<MutationRankGroupArgs, 'rankGroup'>>;
  readInAppNotifications?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<MutationReadInAppNotificationsArgs>>;
  rejectEvent?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<MutationRejectEventArgs, 'id'>>;
  rejectLottoAssignment?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationRejectLottoAssignmentArgs, 'id' | 'shiftId' | 'userId'>>;
  removeAssignment?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveAssignmentArgs, 'id'>>;
  removeBrowserNotificationSubscription?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<MutationRemoveBrowserNotificationSubscriptionArgs>>;
  removeDivision?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveDivisionArgs, 'id'>>;
  removeEquipment?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveEquipmentArgs, 'id'>>;
  removeEvent?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveEventArgs, 'id'>>;
  removeInAppNotifications?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<MutationRemoveInAppNotificationsArgs>>;
  removeIncidentForm?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveIncidentFormArgs, 'id'>>;
  removeNotification?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveNotificationArgs, 'id'>>;
  removeOutsideUser?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveOutsideUserArgs, 'id'>>;
  removeRank?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveRankArgs, 'id'>>;
  removeRankGroup?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveRankGroupArgs, 'id'>>;
  removeRanksFromGroup?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationRemoveRanksFromGroupArgs, 'rankGroupId' | 'rankIds'>>;
  removeShift?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveShiftArgs, 'id'>>;
  removeShiftBufferRequest?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveShiftBufferRequestArgs, 'id'>>;
  removeShiftInterestRequest?: Resolver<ResolversTypes['ID'], ParentType, ContextType, Partial<MutationRemoveShiftInterestRequestArgs>>;
  removeShiftLotteryRequest?: Resolver<ResolversTypes['ID'], ParentType, ContextType, Partial<MutationRemoveShiftLotteryRequestArgs>>;
  removeShifts?: Resolver<Array<Maybe<ResolversTypes['String']>>, ParentType, ContextType, RequireFields<MutationRemoveShiftsArgs, 'shiftId'>>;
  removeSkill?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveSkillArgs, 'id'>>;
  removeUnit?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveUnitArgs, 'id'>>;
  removeUser?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveUserArgs, 'id'>>;
  removeUserEquipment?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveUserEquipmentArgs, 'id'>>;
  removeUserSkill?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveUserSkillArgs, 'id'>>;
  removeVehicleCategory?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveVehicleCategoryArgs, 'id'>>;
  removeVenue?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveVenueArgs, 'id'>>;
  resetImpersonation?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  seenNotifications?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationSeenNotificationsArgs, 'notificationIds'>>;
  setShiftBufferStatus?: Resolver<Maybe<ResolversTypes['ShiftBufferRequest']>, ParentType, ContextType, RequireFields<MutationSetShiftBufferStatusArgs, 'id' | 'status'>>;
  shiftAssign?: Resolver<Maybe<ResolversTypes['Shift']>, ParentType, ContextType, RequireFields<MutationShiftAssignArgs, 'id'>>;
  shiftBufferRequest?: Resolver<Maybe<ResolversTypes['ShiftBufferRequest']>, ParentType, ContextType, Partial<MutationShiftBufferRequestArgs>>;
  shiftInterestRequest?: Resolver<Maybe<ResolversTypes['ShiftInterestRequest']>, ParentType, ContextType, Partial<MutationShiftInterestRequestArgs>>;
  shiftLotteryRequest?: Resolver<Maybe<ResolversTypes['ShiftLotteryRequest']>, ParentType, ContextType, Partial<MutationShiftLotteryRequestArgs>>;
  shifts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Shift']>>>, ParentType, ContextType, RequireFields<MutationShiftsArgs, 'shifts'>>;
  siteLock?: Resolver<Maybe<ResolversTypes['SiteLock']>, ParentType, ContextType, Partial<MutationSiteLockArgs>>;
  skill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<MutationSkillArgs, 'skill'>>;
  templateEvent?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<MutationTemplateEventArgs, 'id'>>;
  unit?: Resolver<Maybe<ResolversTypes['Unit']>, ParentType, ContextType, RequireFields<MutationUnitArgs, 'unit'>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationUserArgs, 'user'>>;
  userEquipment?: Resolver<Maybe<ResolversTypes['MemberEquipment']>, ParentType, ContextType, RequireFields<MutationUserEquipmentArgs, 'userEquipment'>>;
  userEquipmentAttachmentUploadUrl?: Resolver<Maybe<ResolversTypes['MemberEquipmentAttachmentUpload']>, ParentType, ContextType>;
  userSkill?: Resolver<Maybe<ResolversTypes['MemberSkill']>, ParentType, ContextType, RequireFields<MutationUserSkillArgs, 'userSkill'>>;
  userSkillAttachmentUploadUrl?: Resolver<Maybe<ResolversTypes['MemberSkillAttachmentUpload']>, ParentType, ContextType>;
  vehicleCategory?: Resolver<Maybe<ResolversTypes['VehicleCategories']>, ParentType, ContextType, RequireFields<MutationVehicleCategoryArgs, 'vehicleCategory'>>;
  venue?: Resolver<Maybe<ResolversTypes['Venue']>, ParentType, ContextType, RequireFields<MutationVenueArgs, 'venue'>>;
}>;

export type NotificationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Notification'] = ResolversParentTypes['Notification']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  createdById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  expiration?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  frequency?: Resolver<ResolversTypes['NotificationFrequency'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  memberNotification?: Resolver<Maybe<ResolversTypes['MemberNotification']>, ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rankIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  ranks?: Resolver<Array<Maybe<ResolversTypes['Rank']>>, ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  seen?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type NotificationSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['NotificationSearchResult'] = ResolversParentTypes['NotificationSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Notification']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface ObjectIdScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ObjectId'], any> {
  name: 'ObjectId';
}

export type OperationalPeriodResolvers<ContextType = any, ParentType extends ResolversParentTypes['OperationalPeriod'] = ResolversParentTypes['OperationalPeriod']> = ResolversObject<{
  date?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Organization'] = ResolversParentTypes['Organization']> = ResolversObject<{
  address?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  city?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  contact?: Resolver<Maybe<ResolversTypes['OrganizationContact']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  customizations?: Resolver<Maybe<ResolversTypes['OrganizationCustomizations']>, ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  docusign?: Resolver<Maybe<ResolversTypes['DocusignSettings']>, ParentType, ContextType>;
  features?: Resolver<ResolversTypes['OrganizationFeatures'], ParentType, ContextType>;
  flatFeatures?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fromEmail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  settings?: Resolver<Maybe<ResolversTypes['OrganizationOvertimeSettings']>, ParentType, ContextType>;
  sso?: Resolver<Maybe<ResolversTypes['OrganizationSSOSettings']>, ParentType, ContextType>;
  ssoAppName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  weekBegins?: Resolver<Maybe<ResolversTypes['DayOfWeek']>, ParentType, ContextType>;
  zip?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationContactResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationContact'] = ResolversParentTypes['OrganizationContact']> = ResolversObject<{
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationCustomizationsResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationCustomizations'] = ResolversParentTypes['OrganizationCustomizations']> = ResolversObject<{
  dateFormats?: Resolver<ResolversTypes['OrganizationDateFormats'], ParentType, ContextType>;
  pNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tiers?: Resolver<ResolversTypes['OrganizationCustomizationsTiers'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationCustomizationsTierResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationCustomizationsTier'] = ResolversParentTypes['OrganizationCustomizationsTier']> = ResolversObject<{
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationCustomizationsTiersResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationCustomizationsTiers'] = ResolversParentTypes['OrganizationCustomizationsTiers']> = ResolversObject<{
  TIER_1?: Resolver<ResolversTypes['OrganizationCustomizationsTier'], ParentType, ContextType>;
  TIER_2?: Resolver<ResolversTypes['OrganizationCustomizationsTier'], ParentType, ContextType>;
  TIER_3?: Resolver<ResolversTypes['OrganizationCustomizationsTier'], ParentType, ContextType>;
  TIER_4?: Resolver<ResolversTypes['OrganizationCustomizationsTier'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationDateFormatsResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationDateFormats'] = ResolversParentTypes['OrganizationDateFormats']> = ResolversObject<{
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  dateTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  miniDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  time?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationFeatureOptionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationFeatureOptions'] = ResolversParentTypes['OrganizationFeatureOptions']> = ResolversObject<{
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationFeaturesResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationFeatures'] = ResolversParentTypes['OrganizationFeatures']> = ResolversObject<{
  autoEnroll?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  callSign?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  customizableShiftId?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  disabledTierUntil?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  disabledTiers?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  docusign?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  docusignCheckout?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  endOfShiftPDF?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  equipment?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  eventCheckIn?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  eventCheckOut?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  eventInvoice?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  eventTemplates?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  externalEventRequests?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  financeUnit?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  incidentEvents?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  interestLists?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  kiosk?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lasdEventFields?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lasdUserFields?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lottery?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  monthlyMaxHours?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  noShowReport?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  officerCheckInOut?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  outsideUserList?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  profileTenor?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  rankGrouping?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  rankHourlyRate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  signingAuthorityAssignment?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  sso?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  vehicleCategories?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  venueContractDates?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  weeklyMaxShifts?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationOvertimeSettingsResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationOvertimeSettings'] = ResolversParentTypes['OrganizationOvertimeSettings']> = ResolversObject<{
  checkInOut?: Resolver<Maybe<ResolversTypes['CheckInOutSetting']>, ParentType, ContextType>;
  hoursPerMonth?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  interestList?: Resolver<Maybe<ResolversTypes['InterestListSetting']>, ParentType, ContextType>;
  lottery?: Resolver<ResolversTypes['LotterySettings'], ParentType, ContextType>;
  secondaryShiftReminder?: Resolver<Maybe<ResolversTypes['ShiftReminder']>, ParentType, ContextType>;
  shiftBuffer?: Resolver<ResolversTypes['ShiftBuffer'], ParentType, ContextType>;
  shiftReminder?: Resolver<ResolversTypes['ShiftReminder'], ParentType, ContextType>;
  shiftsPerWeek?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  userRelinquishShift?: Resolver<ResolversTypes['UserRelinquishShift'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationSsoSettingsResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationSSOSettings'] = ResolversParentTypes['OrganizationSSOSettings']> = ResolversObject<{
  enablePasswordLogin?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  metadataDocUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  uiSubDomains?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationSearchResult'] = ResolversParentTypes['OrganizationSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Organization']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OutsideUserResolvers<ContextType = any, ParentType extends ResolversParentTypes['OutsideUser'] = ResolversParentTypes['OutsideUser']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OutsideUserSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['OutsideUserSearchResult'] = ResolversParentTypes['OutsideUserSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<ResolversTypes['OutsideUser']>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PhoneResolvers<ContextType = any, ParentType extends ResolversParentTypes['Phone'] = ResolversParentTypes['Phone']> = ResolversObject<{
  number?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  receiveTexts?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProfilePhotoAttachmentUploadResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProfilePhotoAttachmentUpload'] = ResolversParentTypes['ProfilePhotoAttachmentUpload']> = ResolversObject<{
  imagePath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uploadUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  activeLottery?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  activeNotifications?: Resolver<Maybe<ResolversTypes['NotificationSearchResult']>, ParentType, ContextType, Partial<QueryActiveNotificationsArgs>>;
  allUsers?: Resolver<Maybe<ResolversTypes['UserSearchResult']>, ParentType, ContextType, Partial<QueryAllUsersArgs>>;
  assignment?: Resolver<Maybe<ResolversTypes['Assignment']>, ParentType, ContextType, RequireFields<QueryAssignmentArgs, 'id'>>;
  assignments?: Resolver<Maybe<ResolversTypes['AssignmentSearchResult']>, ParentType, ContextType, Partial<QueryAssignmentsArgs>>;
  availableShifts?: Resolver<Maybe<ResolversTypes['ShiftSearchResult']>, ParentType, ContextType, Partial<QueryAvailableShiftsArgs>>;
  division?: Resolver<Maybe<ResolversTypes['Division']>, ParentType, ContextType, RequireFields<QueryDivisionArgs, 'id'>>;
  divisions?: Resolver<Maybe<ResolversTypes['DivisionSearchResult']>, ParentType, ContextType, Partial<QueryDivisionsArgs>>;
  docusignEvents?: Resolver<Maybe<ResolversTypes['DocusignEventSearchResult']>, ParentType, ContextType, RequireFields<QueryDocusignEventsArgs, 'input'>>;
  equipment?: Resolver<Maybe<ResolversTypes['Equipment']>, ParentType, ContextType, RequireFields<QueryEquipmentArgs, 'id'>>;
  equipments?: Resolver<Maybe<ResolversTypes['EquipmentSearchResult']>, ParentType, ContextType, Partial<QueryEquipmentsArgs>>;
  event?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<QueryEventArgs, 'id'>>;
  events?: Resolver<Maybe<ResolversTypes['EventSearchResult']>, ParentType, ContextType, Partial<QueryEventsArgs>>;
  financeShifts?: Resolver<Maybe<Array<Maybe<ResolversTypes['FinanceShift']>>>, ParentType, ContextType, RequireFields<QueryFinanceShiftsArgs, 'eventId'>>;
  groupedShifts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Shift']>>>, ParentType, ContextType, RequireFields<QueryGroupedShiftsArgs, 'shiftId'>>;
  health?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  inAppNotifications?: Resolver<Maybe<ResolversTypes['InAppNotificationSearchResult']>, ParentType, ContextType, Partial<QueryInAppNotificationsArgs>>;
  incidentForms?: Resolver<Maybe<ResolversTypes['IncidentFormSearchResult']>, ParentType, ContextType, Partial<QueryIncidentFormsArgs>>;
  lotteryCounter?: Resolver<Maybe<ResolversTypes['LotteryCounter']>, ParentType, ContextType, Partial<QueryLotteryCounterArgs>>;
  lotteryCounters?: Resolver<Maybe<ResolversTypes['LotteryCounterSearchResult']>, ParentType, ContextType, Partial<QueryLotteryCountersArgs>>;
  lotteryShifts?: Resolver<Maybe<ResolversTypes['ShiftSearchResult']>, ParentType, ContextType>;
  lottoAnalytics?: Resolver<Maybe<ResolversTypes['LottoAnalytics']>, ParentType, ContextType, Partial<QueryLottoAnalyticsArgs>>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  memberEquipments?: Resolver<Maybe<ResolversTypes['MemberEquipmentSearchResult']>, ParentType, ContextType, Partial<QueryMemberEquipmentsArgs>>;
  memberSkills?: Resolver<Maybe<ResolversTypes['MemberSkillSearchResult']>, ParentType, ContextType, Partial<QueryMemberSkillsArgs>>;
  notification?: Resolver<Maybe<ResolversTypes['Notification']>, ParentType, ContextType, RequireFields<QueryNotificationArgs, 'id'>>;
  notifications?: Resolver<Maybe<ResolversTypes['NotificationSearchResult']>, ParentType, ContextType, Partial<QueryNotificationsArgs>>;
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  organizationById?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType, RequireFields<QueryOrganizationByIdArgs, 'orgId'>>;
  organizationFeatures?: Resolver<Maybe<Array<Maybe<ResolversTypes['OrganizationFeatureOptions']>>>, ParentType, ContextType>;
  organizations?: Resolver<Maybe<ResolversTypes['OrganizationSearchResult']>, ParentType, ContextType, Partial<QueryOrganizationsArgs>>;
  outsideUsers?: Resolver<Maybe<ResolversTypes['OutsideUserSearchResult']>, ParentType, ContextType, Partial<QueryOutsideUsersArgs>>;
  rank?: Resolver<Maybe<ResolversTypes['Rank']>, ParentType, ContextType, RequireFields<QueryRankArgs, 'id'>>;
  rankGroups?: Resolver<Maybe<ResolversTypes['RankGroupSearchResult']>, ParentType, ContextType, Partial<QueryRankGroupsArgs>>;
  ranks?: Resolver<Maybe<ResolversTypes['RankSearchResult']>, ParentType, ContextType, Partial<QueryRanksArgs>>;
  shift?: Resolver<Maybe<ResolversTypes['Shift']>, ParentType, ContextType, RequireFields<QueryShiftArgs, 'id'>>;
  shiftBufferRequests?: Resolver<Maybe<ResolversTypes['ShiftBufferRequestsSearchResult']>, ParentType, ContextType, Partial<QueryShiftBufferRequestsArgs>>;
  shiftInterestRequests?: Resolver<Maybe<ResolversTypes['ShiftInterestRequestsSearchResult']>, ParentType, ContextType, Partial<QueryShiftInterestRequestsArgs>>;
  shiftLotteryRequests?: Resolver<Maybe<ResolversTypes['ShiftLotteryRequestsSearchResult']>, ParentType, ContextType, Partial<QueryShiftLotteryRequestsArgs>>;
  shiftLottoRequests?: Resolver<Maybe<ResolversTypes['ShiftLotteryRequestsSearchResult']>, ParentType, ContextType, RequireFields<QueryShiftLottoRequestsArgs, 'input'>>;
  shiftTabs?: Resolver<Maybe<ResolversTypes['ShiftTabResponse']>, ParentType, ContextType, RequireFields<QueryShiftTabsArgs, 'id'>>;
  shiftUsers?: Resolver<Maybe<ResolversTypes['UserSearchResult']>, ParentType, ContextType, RequireFields<QueryShiftUsersArgs, 'id'>>;
  shifts?: Resolver<Maybe<ResolversTypes['ShiftSearchResult']>, ParentType, ContextType, Partial<QueryShiftsArgs>>;
  signingAuthorityAssignments?: Resolver<Maybe<ResolversTypes['AssignmentSearchResult']>, ParentType, ContextType, RequireFields<QuerySigningAuthorityAssignmentsArgs, 'eventId'>>;
  siteLock?: Resolver<Maybe<ResolversTypes['SiteLock']>, ParentType, ContextType>;
  skill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<QuerySkillArgs, 'id'>>;
  skills?: Resolver<Maybe<ResolversTypes['SkillSearchResult']>, ParentType, ContextType, Partial<QuerySkillsArgs>>;
  unit?: Resolver<Maybe<ResolversTypes['Unit']>, ParentType, ContextType, RequireFields<QueryUnitArgs, 'id'>>;
  units?: Resolver<Maybe<ResolversTypes['UnitSearchResult']>, ParentType, ContextType, Partial<QueryUnitsArgs>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'id'>>;
  users?: Resolver<Maybe<ResolversTypes['UserSearchResult']>, ParentType, ContextType, Partial<QueryUsersArgs>>;
  vehicleCategories?: Resolver<Maybe<ResolversTypes['VehicleCategoriesSearchResult']>, ParentType, ContextType, Partial<QueryVehicleCategoriesArgs>>;
  vehicleCategory?: Resolver<Maybe<ResolversTypes['Division']>, ParentType, ContextType, RequireFields<QueryVehicleCategoryArgs, 'id'>>;
  venue?: Resolver<Maybe<ResolversTypes['Venue']>, ParentType, ContextType, RequireFields<QueryVenueArgs, 'id'>>;
  venues?: Resolver<Maybe<ResolversTypes['VenueSearchResult']>, ParentType, ContextType, Partial<QueryVenuesArgs>>;
}>;

export type RankResolvers<ContextType = any, ParentType extends ResolversParentTypes['Rank'] = ResolversParentTypes['Rank']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  hourlyRate?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  incidentHourlyRate?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  org?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rankGroup?: Resolver<Maybe<ResolversTypes['RankGroup']>, ParentType, ContextType>;
  rankGroupId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RankGroupResolvers<ContextType = any, ParentType extends ResolversParentTypes['RankGroup'] = ResolversParentTypes['RankGroup']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  org?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rankIds?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  ranks?: Resolver<Maybe<Array<ResolversTypes['Rank']>>, ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RankGroupSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['RankGroupSearchResult'] = ResolversParentTypes['RankGroupSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['RankGroup']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RankSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['RankSearchResult'] = ResolversParentTypes['RankSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Rank']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftResolvers<ContextType = any, ParentType extends ResolversParentTypes['Shift'] = ResolversParentTypes['Shift']> = ResolversObject<{
  assignment?: Resolver<ResolversTypes['Assignment'], ParentType, ContextType>;
  assignmentId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  availability?: Resolver<Maybe<ResolversTypes['ShiftAvailabilityTime']>, ParentType, ContextType>;
  callSign?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  createdById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  customId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  docusignEvent?: Resolver<Maybe<ResolversTypes['DocusignEvent']>, ParentType, ContextType>;
  endTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  event?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  eventId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  locked?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  lotteryRequest?: Resolver<Maybe<ResolversTypes['ShiftLotteryRequest']>, ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  notificationId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  order?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  otherShiftSlots?: Resolver<Maybe<Array<Maybe<ResolversTypes['Shift']>>>, ParentType, ContextType>;
  refNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  relinquishNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shiftBufferShift?: Resolver<Maybe<ResolversTypes['Shift']>, ParentType, ContextType>;
  shiftCheckInOut?: Resolver<Maybe<ResolversTypes['ShiftCheckInOut']>, ParentType, ContextType>;
  shiftId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  shiftInterestRequest?: Resolver<Maybe<ResolversTypes['ShiftInterestRequest']>, ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ShiftStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftAvailabilityTimeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftAvailabilityTime'] = ResolversParentTypes['ShiftAvailabilityTime']> = ResolversObject<{
  friday?: Resolver<Maybe<ResolversTypes['ShiftDayTime']>, ParentType, ContextType>;
  monday?: Resolver<Maybe<ResolversTypes['ShiftDayTime']>, ParentType, ContextType>;
  saturday?: Resolver<Maybe<ResolversTypes['ShiftDayTime']>, ParentType, ContextType>;
  sunday?: Resolver<Maybe<ResolversTypes['ShiftDayTime']>, ParentType, ContextType>;
  thursday?: Resolver<Maybe<ResolversTypes['ShiftDayTime']>, ParentType, ContextType>;
  tuesday?: Resolver<Maybe<ResolversTypes['ShiftDayTime']>, ParentType, ContextType>;
  wednesday?: Resolver<Maybe<ResolversTypes['ShiftDayTime']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftBufferResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftBuffer'] = ResolversParentTypes['ShiftBuffer']> = ResolversObject<{
  adminOverrideShiftBuffer?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  minuteShiftBuffer?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftBufferRequestResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftBufferRequest'] = ResolversParentTypes['ShiftBufferRequest']> = ResolversObject<{
  assignment?: Resolver<ResolversTypes['Assignment'], ParentType, ContextType>;
  assignmentId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  event?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  eventId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  note?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shift?: Resolver<ResolversTypes['Shift'], ParentType, ContextType>;
  shiftBufferShift?: Resolver<ResolversTypes['Shift'], ParentType, ContextType>;
  shiftBufferShiftId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  shiftGroupId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  shiftId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ShiftBufferRequestStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftBufferRequestsSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftBufferRequestsSearchResult'] = ResolversParentTypes['ShiftBufferRequestsSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['ShiftBufferRequest']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftCheckInOutResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftCheckInOut'] = ResolversParentTypes['ShiftCheckInOut']> = ResolversObject<{
  adminNotes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  checkInCoords?: Resolver<Maybe<ResolversTypes['ShiftCheckInOutCoordinates']>, ParentType, ContextType>;
  checkInEquipmentTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  checkInNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  checkInTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  checkOutCoords?: Resolver<Maybe<ResolversTypes['ShiftCheckInOutCoordinates']>, ParentType, ContextType>;
  checkOutEquipmentTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  checkOutNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  checkOutTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  equipmentDetails?: Resolver<Maybe<ResolversTypes['ShiftCheckInOutEquipment']>, ParentType, ContextType>;
  noShow?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftCheckInOutCoordinatesResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftCheckInOutCoordinates'] = ResolversParentTypes['ShiftCheckInOutCoordinates']> = ResolversObject<{
  accuracy?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  altitude?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  altitudeAccuracy?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  heading?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  latitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  longitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  speed?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftCheckInOutEquipmentResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftCheckInOutEquipment'] = ResolversParentTypes['ShiftCheckInOutEquipment']> = ResolversObject<{
  checkInTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  checkOutTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  vehicleCategory?: Resolver<Maybe<ResolversTypes['VehicleCategories']>, ParentType, ContextType>;
  vehicleCategoryId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftCheckOutResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftCheckOutResponse'] = ResolversParentTypes['ShiftCheckOutResponse']> = ResolversObject<{
  shift?: Resolver<ResolversTypes['Shift'], ParentType, ContextType>;
  signingUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftDayTimeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftDayTime'] = ResolversParentTypes['ShiftDayTime']> = ResolversObject<{
  endTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftDetailsResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftDetails'] = ResolversParentTypes['ShiftDetails']> = ResolversObject<{
  arrivalAtUOA?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  enrouteToIncident?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  staging1097?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  staging1098?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  time18Hour?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftInterestRequestResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftInterestRequest'] = ResolversParentTypes['ShiftInterestRequest']> = ResolversObject<{
  assignedShift?: Resolver<Maybe<ResolversTypes['Shift']>, ParentType, ContextType>;
  assignment?: Resolver<ResolversTypes['Assignment'], ParentType, ContextType>;
  assignmentId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  event?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  eventId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shift?: Resolver<Maybe<ResolversTypes['Shift']>, ParentType, ContextType>;
  shiftGroupId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['ShiftInterestRequestStatus']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, Partial<ShiftInterestRequestUserArgs>>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftInterestRequestsSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftInterestRequestsSearchResult'] = ResolversParentTypes['ShiftInterestRequestsSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['ShiftInterestRequest']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftLotteryRequestResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftLotteryRequest'] = ResolversParentTypes['ShiftLotteryRequest']> = ResolversObject<{
  assignment?: Resolver<ResolversTypes['Assignment'], ParentType, ContextType>;
  assignmentId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  event?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  eventId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lotteryCounter?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  order?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shift?: Resolver<Maybe<ResolversTypes['Shift']>, ParentType, ContextType>;
  shiftGroupId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['ShiftLotteryRequestStatus']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, Partial<ShiftLotteryRequestUserArgs>>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftLotteryRequestsSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftLotteryRequestsSearchResult'] = ResolversParentTypes['ShiftLotteryRequestsSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['ShiftLotteryRequest']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftReminderResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftReminder'] = ResolversParentTypes['ShiftReminder']> = ResolversObject<{
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  time?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unit?: Resolver<ResolversTypes['ShiftReminderUnit'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftSearchResult'] = ResolversParentTypes['ShiftSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Shift']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftTabResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftTabResponse'] = ResolversParentTypes['ShiftTabResponse']> = ResolversObject<{
  data?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  templateName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SiteLockResolvers<ContextType = any, ParentType extends ResolversParentTypes['SiteLock'] = ResolversParentTypes['SiteLock']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  locked?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  org?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SkillResolvers<ContextType = any, ParentType extends ResolversParentTypes['Skill'] = ResolversParentTypes['Skill']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rankOnlyIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  ranksOnly?: Resolver<Maybe<Array<Maybe<ResolversTypes['Rank']>>>, ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  requiresAdminApproval?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  requiresCert?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SkillSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SkillSearchResult'] = ResolversParentTypes['SkillSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Skill']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TimekeepingResolvers<ContextType = any, ParentType extends ResolversParentTypes['Timekeeping'] = ResolversParentTypes['Timekeeping']> = ResolversObject<{
  overtimeHours?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  overtimeTimeIn?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  overtimeTimeOut?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  rdo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  straightHours?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  timeIn?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  timeOut?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['TimekeepingType']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UnitResolvers<ContextType = any, ParentType extends ResolversParentTypes['Unit'] = ResolversParentTypes['Unit']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  divisionIds?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  divisions?: Resolver<Maybe<Array<Maybe<ResolversTypes['Division']>>>, ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  org?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  overtimeCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UnitSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['UnitSearchResult'] = ResolversParentTypes['UnitSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Unit']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  browserNotificationSettings?: Resolver<Maybe<Array<Maybe<ResolversTypes['BrowserNotificationSetting']>>>, ParentType, ContextType>;
  cognitoId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  imagePath?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  member?: Resolver<ResolversTypes['Member'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  numberOfHoursThisMonth?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  numberOfShiftsThisWeek?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shiftsThisWeek?: Resolver<Maybe<Array<Maybe<ResolversTypes['Shift']>>>, ParentType, ContextType>;
  superAdmin?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserAvailabilityResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserAvailability'] = ResolversParentTypes['UserAvailability']> = ResolversObject<{
  friday?: Resolver<ResolversTypes['DayAvailability'], ParentType, ContextType>;
  monday?: Resolver<ResolversTypes['DayAvailability'], ParentType, ContextType>;
  saturday?: Resolver<ResolversTypes['DayAvailability'], ParentType, ContextType>;
  sunday?: Resolver<ResolversTypes['DayAvailability'], ParentType, ContextType>;
  thursday?: Resolver<ResolversTypes['DayAvailability'], ParentType, ContextType>;
  tuesday?: Resolver<ResolversTypes['DayAvailability'], ParentType, ContextType>;
  wednesday?: Resolver<ResolversTypes['DayAvailability'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserRelinquishShiftResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserRelinquishShift'] = ResolversParentTypes['UserRelinquishShift']> = ResolversObject<{
  afterShiftRemove?: Resolver<ResolversTypes['AfterShiftRemove'], ParentType, ContextType>;
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  numberOfHoursBeforeShift?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  requireNoteWhenRelinquishing?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserSearchResult'] = ResolversParentTypes['UserSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VehicleCategoriesResolvers<ContextType = any, ParentType extends ResolversParentTypes['VehicleCategories'] = ResolversParentTypes['VehicleCategories']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  milageRate?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  org?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VehicleCategoriesSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['VehicleCategoriesSearchResult'] = ResolversParentTypes['VehicleCategoriesSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['VehicleCategories']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VehicleInformationResolvers<ContextType = any, ParentType extends ResolversParentTypes['VehicleInformation'] = ResolversParentTypes['VehicleInformation']> = ResolversObject<{
  endingMileage?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  hasVehicle?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  startingMileage?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  vehicleCategory?: Resolver<Maybe<ResolversTypes['ObjectId']>, ParentType, ContextType>;
  vehicleMake?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  vehicleModel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  vehicleNumber?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VenueResolvers<ContextType = any, ParentType extends ResolversParentTypes['Venue'] = ResolversParentTypes['Venue']> = ResolversObject<{
  address?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  city?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  contact?: Resolver<Maybe<ResolversTypes['VenueContact']>, ParentType, ContextType>;
  contract?: Resolver<Maybe<ResolversTypes['VenueContract']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['VenueStatus']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  zip?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VenueContactResolvers<ContextType = any, ParentType extends ResolversParentTypes['VenueContact'] = ResolversParentTypes['VenueContact']> = ResolversObject<{
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lastName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VenueContractResolvers<ContextType = any, ParentType extends ResolversParentTypes['VenueContract'] = ResolversParentTypes['VenueContract']> = ResolversObject<{
  expirationDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  insuranceName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VenueSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['VenueSearchResult'] = ResolversParentTypes['VenueSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Venue']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  ActivityLog?: ActivityLogResolvers<ContextType>;
  ActivityLogEntry?: ActivityLogEntryResolvers<ContextType>;
  AfterShiftRemove?: AfterShiftRemoveResolvers<ContextType>;
  Assignment?: AssignmentResolvers<ContextType>;
  AssignmentSearchResult?: AssignmentSearchResultResolvers<ContextType>;
  AssignmentShiftSlot?: AssignmentShiftSlotResolvers<ContextType>;
  AssignmentSummary?: AssignmentSummaryResolvers<ContextType>;
  AvailabilityTime?: AvailabilityTimeResolvers<ContextType>;
  BrowserNotificationKeys?: BrowserNotificationKeysResolvers<ContextType>;
  BrowserNotificationSetting?: BrowserNotificationSettingResolvers<ContextType>;
  BrowserNotificationSubscription?: BrowserNotificationSubscriptionResolvers<ContextType>;
  CheckInOutSetting?: CheckInOutSettingResolvers<ContextType>;
  ContactInfo?: ContactInfoResolvers<ContextType>;
  Date?: GraphQLScalarType;
  DateTime?: GraphQLScalarType;
  DayAvailability?: DayAvailabilityResolvers<ContextType>;
  Division?: DivisionResolvers<ContextType>;
  DivisionSearchResult?: DivisionSearchResultResolvers<ContextType>;
  DocusignEvent?: DocusignEventResolvers<ContextType>;
  DocusignEventSearchResult?: DocusignEventSearchResultResolvers<ContextType>;
  DocusignSettings?: DocusignSettingsResolvers<ContextType>;
  DocusignSignerDetails?: DocusignSignerDetailsResolvers<ContextType>;
  DocusignSignerDetailsData?: DocusignSignerDetailsDataResolvers<ContextType>;
  Email?: EmailResolvers<ContextType>;
  Equipment?: EquipmentResolvers<ContextType>;
  EquipmentSearchResult?: EquipmentSearchResultResolvers<ContextType>;
  Event?: EventResolvers<ContextType>;
  EventAttachmentUpload?: EventAttachmentUploadResolvers<ContextType>;
  EventInvoiceResponse?: EventInvoiceResponseResolvers<ContextType>;
  EventRequestDetails?: EventRequestDetailsResolvers<ContextType>;
  EventSearchResult?: EventSearchResultResolvers<ContextType>;
  FinanceShift?: FinanceShiftResolvers<ContextType>;
  InAppNotificationMeta?: InAppNotificationMetaResolvers<ContextType>;
  InAppNotificationSearchResult?: InAppNotificationSearchResultResolvers<ContextType>;
  InAppNotifications?: InAppNotificationsResolvers<ContextType>;
  IncidentForm?: IncidentFormResolvers<ContextType>;
  IncidentFormResponse?: IncidentFormResponseResolvers<ContextType>;
  IncidentFormSearchResult?: IncidentFormSearchResultResolvers<ContextType>;
  InterestListSetting?: InterestListSettingResolvers<ContextType>;
  LotteryCounter?: LotteryCounterResolvers<ContextType>;
  LotteryCounterSearchResult?: LotteryCounterSearchResultResolvers<ContextType>;
  LotteryDate?: LotteryDateResolvers<ContextType>;
  LotterySettings?: LotterySettingsResolvers<ContextType>;
  LottoAnalytics?: LottoAnalyticsResolvers<ContextType>;
  LottoRequests?: LottoRequestsResolvers<ContextType>;
  Member?: MemberResolvers<ContextType>;
  MemberEquipment?: MemberEquipmentResolvers<ContextType>;
  MemberEquipmentAttachmentUpload?: MemberEquipmentAttachmentUploadResolvers<ContextType>;
  MemberEquipmentSearchResult?: MemberEquipmentSearchResultResolvers<ContextType>;
  MemberNotification?: MemberNotificationResolvers<ContextType>;
  MemberSkill?: MemberSkillResolvers<ContextType>;
  MemberSkillAttachmentUpload?: MemberSkillAttachmentUploadResolvers<ContextType>;
  MemberSkillSearchResult?: MemberSkillSearchResultResolvers<ContextType>;
  MissionAssignments?: MissionAssignmentsResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Notification?: NotificationResolvers<ContextType>;
  NotificationSearchResult?: NotificationSearchResultResolvers<ContextType>;
  ObjectId?: GraphQLScalarType;
  OperationalPeriod?: OperationalPeriodResolvers<ContextType>;
  Organization?: OrganizationResolvers<ContextType>;
  OrganizationContact?: OrganizationContactResolvers<ContextType>;
  OrganizationCustomizations?: OrganizationCustomizationsResolvers<ContextType>;
  OrganizationCustomizationsTier?: OrganizationCustomizationsTierResolvers<ContextType>;
  OrganizationCustomizationsTiers?: OrganizationCustomizationsTiersResolvers<ContextType>;
  OrganizationDateFormats?: OrganizationDateFormatsResolvers<ContextType>;
  OrganizationFeatureOptions?: OrganizationFeatureOptionsResolvers<ContextType>;
  OrganizationFeatures?: OrganizationFeaturesResolvers<ContextType>;
  OrganizationOvertimeSettings?: OrganizationOvertimeSettingsResolvers<ContextType>;
  OrganizationSSOSettings?: OrganizationSsoSettingsResolvers<ContextType>;
  OrganizationSearchResult?: OrganizationSearchResultResolvers<ContextType>;
  OutsideUser?: OutsideUserResolvers<ContextType>;
  OutsideUserSearchResult?: OutsideUserSearchResultResolvers<ContextType>;
  Phone?: PhoneResolvers<ContextType>;
  ProfilePhotoAttachmentUpload?: ProfilePhotoAttachmentUploadResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Rank?: RankResolvers<ContextType>;
  RankGroup?: RankGroupResolvers<ContextType>;
  RankGroupSearchResult?: RankGroupSearchResultResolvers<ContextType>;
  RankSearchResult?: RankSearchResultResolvers<ContextType>;
  Shift?: ShiftResolvers<ContextType>;
  ShiftAvailabilityTime?: ShiftAvailabilityTimeResolvers<ContextType>;
  ShiftBuffer?: ShiftBufferResolvers<ContextType>;
  ShiftBufferRequest?: ShiftBufferRequestResolvers<ContextType>;
  ShiftBufferRequestsSearchResult?: ShiftBufferRequestsSearchResultResolvers<ContextType>;
  ShiftCheckInOut?: ShiftCheckInOutResolvers<ContextType>;
  ShiftCheckInOutCoordinates?: ShiftCheckInOutCoordinatesResolvers<ContextType>;
  ShiftCheckInOutEquipment?: ShiftCheckInOutEquipmentResolvers<ContextType>;
  ShiftCheckOutResponse?: ShiftCheckOutResponseResolvers<ContextType>;
  ShiftDayTime?: ShiftDayTimeResolvers<ContextType>;
  ShiftDetails?: ShiftDetailsResolvers<ContextType>;
  ShiftInterestRequest?: ShiftInterestRequestResolvers<ContextType>;
  ShiftInterestRequestsSearchResult?: ShiftInterestRequestsSearchResultResolvers<ContextType>;
  ShiftLotteryRequest?: ShiftLotteryRequestResolvers<ContextType>;
  ShiftLotteryRequestsSearchResult?: ShiftLotteryRequestsSearchResultResolvers<ContextType>;
  ShiftReminder?: ShiftReminderResolvers<ContextType>;
  ShiftSearchResult?: ShiftSearchResultResolvers<ContextType>;
  ShiftTabResponse?: ShiftTabResponseResolvers<ContextType>;
  SiteLock?: SiteLockResolvers<ContextType>;
  Skill?: SkillResolvers<ContextType>;
  SkillSearchResult?: SkillSearchResultResolvers<ContextType>;
  Timekeeping?: TimekeepingResolvers<ContextType>;
  Unit?: UnitResolvers<ContextType>;
  UnitSearchResult?: UnitSearchResultResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserAvailability?: UserAvailabilityResolvers<ContextType>;
  UserRelinquishShift?: UserRelinquishShiftResolvers<ContextType>;
  UserSearchResult?: UserSearchResultResolvers<ContextType>;
  VehicleCategories?: VehicleCategoriesResolvers<ContextType>;
  VehicleCategoriesSearchResult?: VehicleCategoriesSearchResultResolvers<ContextType>;
  VehicleInformation?: VehicleInformationResolvers<ContextType>;
  Venue?: VenueResolvers<ContextType>;
  VenueContact?: VenueContactResolvers<ContextType>;
  VenueContract?: VenueContractResolvers<ContextType>;
  VenueSearchResult?: VenueSearchResultResolvers<ContextType>;
}>;

