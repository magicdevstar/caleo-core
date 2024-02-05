import { GraphQLResolveInfo } from 'graphql';

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
};

export type AfterShiftRemove = {
  __typename?: 'AfterShiftRemove';
  days: Scalars['Int']['output'];
  tier: MemberTier;
};

export type Assignment = {
  __typename?: 'Assignment';
  availableShifts?: Maybe<Scalars['Int']['output']>;
  bwNeeded: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  docType: DocType;
  event: Event;
  eventId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  notifyWhenFullyStaffed?: Maybe<Scalars['Boolean']['output']>;
  org: Organization;
  orgId: Scalars['String']['output'];
  rankIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  ranks?: Maybe<Array<Maybe<Rank>>>;
  removedAt?: Maybe<Scalars['String']['output']>;
  requiredSkillIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  requiredSkills?: Maybe<Array<Maybe<Skill>>>;
  shiftIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  shifts?: Maybe<Array<Maybe<Shift>>>;
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
  id: Scalars['ID']['output'];
  orgId: Scalars['String']['output'];
  subscription: BrowserNotificationSubscription;
  userId: Scalars['String']['output'];
};

export type BrowserNotificationSubscription = {
  __typename?: 'BrowserNotificationSubscription';
  endpoint: Scalars['String']['output'];
  expirationTime?: Maybe<Scalars['String']['output']>;
  keys: BrowserNotificationKeys;
};

export type ContactInfo = {
  __typename?: 'ContactInfo';
  primaryEmail: Email;
  primaryPhone: Phone;
  secondaryEmail?: Maybe<Email>;
  secondaryPhone?: Maybe<Phone>;
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

export enum DocType {
  Assignment = 'ASSIGNMENT',
  BrowserNotificationSetting = 'BROWSER_NOTIFICATION_SETTING',
  Event = 'EVENT',
  LotteryCounter = 'LOTTERY_COUNTER',
  LotteryState = 'LOTTERY_STATE',
  MemberNotification = 'MEMBER_NOTIFICATION',
  MemberSkill = 'MEMBER_SKILL',
  Notification = 'NOTIFICATION',
  Organization = 'ORGANIZATION',
  Rank = 'RANK',
  Shift = 'SHIFT',
  ShiftBufferRequest = 'SHIFT_BUFFER_REQUEST',
  ShiftLotteryRequest = 'SHIFT_LOTTERY_REQUEST',
  SiteLock = 'SITE_LOCK',
  Skill = 'SKILL',
  User = 'USER',
  Venue = 'VENUE'
}

export type Email = {
  __typename?: 'Email';
  address: Scalars['String']['output'];
  receiveEmails: Scalars['Boolean']['output'];
};

export type Event = {
  __typename?: 'Event';
  assignmentIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  assignments?: Maybe<Array<Assignment>>;
  attachmentPaths?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  attachments?: Maybe<Array<Scalars['String']['output']>>;
  availableShifts?: Maybe<Scalars['Int']['output']>;
  createdAt: Scalars['String']['output'];
  createdBy?: Maybe<User>;
  createdById?: Maybe<Scalars['String']['output']>;
  docType: DocType;
  endTime?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lotteryCounter?: Maybe<LotteryCounter>;
  lotteryNumber?: Maybe<Scalars['Int']['output']>;
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  notifyOnFirstComeFirstServe?: Maybe<Scalars['Boolean']['output']>;
  notifyWhenFullyStaffed?: Maybe<Scalars['Boolean']['output']>;
  org: Organization;
  orgId: Scalars['String']['output'];
  referenceId: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  scheduledFirstComeFirstServe?: Maybe<Scalars['String']['output']>;
  searchAttribute: Scalars['String']['output'];
  startTime?: Maybe<Scalars['String']['output']>;
  status: EventStatus;
  updatedAt: Scalars['String']['output'];
  venue?: Maybe<Venue>;
  venueId: Scalars['String']['output'];
};

export type EventAttachmentUpload = {
  __typename?: 'EventAttachmentUpload';
  attachmentPath: Scalars['String']['output'];
  uploadUrl: Scalars['String']['output'];
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
  PreFirstComeFirstServe = 'PRE_FIRST_COME_FIRST_SERVE',
  PreLottery = 'PRE_LOTTERY',
  ReadyForLottery = 'READY_FOR_LOTTERY',
  Removed = 'REMOVED'
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

export type InputUserAvailability = {
  friday: InputDayAvailability;
  monday: InputDayAvailability;
  saturday: InputDayAvailability;
  sunday: InputDayAvailability;
  thursday: InputDayAvailability;
  tuesday: InputDayAvailability;
  wednesday: InputDayAvailability;
};

export type InviteMember = {
  rankId?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<MemberRole>;
  tier?: InputMaybe<MemberTier>;
};

export type InviteUser = {
  email: Scalars['String']['input'];
  member: InviteMember;
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

export type Member = {
  __typename?: 'Member';
  adminNote?: Maybe<Scalars['String']['output']>;
  availability: UserAvailability;
  contactInfo?: Maybe<ContactInfo>;
  deactivationNote?: Maybe<Scalars['String']['output']>;
  inactivateUntil?: Maybe<Scalars['String']['output']>;
  inactivationNote?: Maybe<Scalars['String']['output']>;
  maxShifts?: Maybe<Scalars['Int']['output']>;
  memberSkillIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  memberSkills?: Maybe<Array<Maybe<MemberSkill>>>;
  org?: Maybe<Organization>;
  orgId: Scalars['String']['output'];
  pNumber: Scalars['String']['output'];
  rank?: Maybe<Rank>;
  rankId?: Maybe<Scalars['String']['output']>;
  role?: Maybe<MemberRole>;
  status?: Maybe<MemberStatus>;
  tier?: Maybe<MemberTier>;
  tierResetOnNextLottery?: Maybe<Scalars['Boolean']['output']>;
  tierUntil?: Maybe<Scalars['String']['output']>;
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
  Tier_2 = 'TIER_2'
}

export type Mutation = {
  __typename?: 'Mutation';
  adminEditPassword?: Maybe<Scalars['Boolean']['output']>;
  approveLottoAssignment?: Maybe<Scalars['Boolean']['output']>;
  assignment?: Maybe<Assignment>;
  browserNotificationSubscription?: Maybe<BrowserNotificationSetting>;
  event?: Maybe<Event>;
  eventAttachmentUploadUrl?: Maybe<EventAttachmentUpload>;
  inviteUser?: Maybe<User>;
  newUser?: Maybe<User>;
  notification?: Maybe<Notification>;
  notifyUsersOfEvent?: Maybe<Scalars['Boolean']['output']>;
  notifyUsersOfShift?: Maybe<Scalars['Boolean']['output']>;
  organization?: Maybe<Organization>;
  profilePhotoUploadUrl?: Maybe<ProfilePhotoAttachmentUpload>;
  rank?: Maybe<Rank>;
  rejectLottoAssignment?: Maybe<Scalars['Boolean']['output']>;
  removeAssignment: Scalars['ID']['output'];
  removeEvent: Scalars['ID']['output'];
  removeNotification: Scalars['ID']['output'];
  removeRank: Scalars['ID']['output'];
  removeShift: Scalars['ID']['output'];
  removeShiftBufferRequest: Scalars['ID']['output'];
  removeShiftLotteryRequest: Scalars['ID']['output'];
  removeShifts: Array<Maybe<Scalars['String']['output']>>;
  removeSkill: Scalars['ID']['output'];
  removeUser: Scalars['ID']['output'];
  removeUserSkill: Scalars['ID']['output'];
  removeVenue: Scalars['ID']['output'];
  seenNotifications?: Maybe<Scalars['Boolean']['output']>;
  setShiftBufferStatus?: Maybe<ShiftBufferRequest>;
  shiftAssign?: Maybe<Shift>;
  shiftBufferRequest?: Maybe<ShiftBufferRequest>;
  shiftLotteryRequest?: Maybe<ShiftLotteryRequest>;
  shifts?: Maybe<Array<Maybe<Shift>>>;
  siteLock?: Maybe<SiteLock>;
  skill?: Maybe<Skill>;
  user?: Maybe<User>;
  userSkill?: Maybe<MemberSkill>;
  userSkillAttachmentUploadUrl?: Maybe<MemberSkillAttachmentUpload>;
  venue?: Maybe<Venue>;
};


export type MutationAdminEditPasswordArgs = {
  input: InputAdminResetPassword;
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


export type MutationEventArgs = {
  event: UpsertEvent;
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


export type MutationRankArgs = {
  rank: UpsertRank;
};


export type MutationRejectLottoAssignmentArgs = {
  id: Scalars['String']['input'];
  shiftId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type MutationRemoveAssignmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveEventArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveNotificationArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveRankArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveShiftArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveShiftBufferRequestArgs = {
  id: Scalars['String']['input'];
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


export type MutationRemoveUserArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveUserSkillArgs = {
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


export type MutationShiftLotteryRequestArgs = {
  shiftLotteryRequest?: InputMaybe<UpsertShiftLotteryRequest>;
};


export type MutationShiftsArgs = {
  shifts: Array<InputMaybe<UpsertShift>>;
};


export type MutationSiteLockArgs = {
  input?: InputMaybe<UpsertSiteLock>;
};


export type MutationSkillArgs = {
  skill: UpsertSkill;
};


export type MutationUserArgs = {
  user: UpdateUser;
};


export type MutationUserSkillArgs = {
  userSkill: UpsertMemberSkill;
};


export type MutationVenueArgs = {
  venue: UpsertVenue;
};

export type NewContactInfo = {
  primaryEmail: NewEmail;
  primaryPhone: NewPhone;
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
  inactivateUntil?: InputMaybe<Scalars['String']['input']>;
  inactivationNote?: InputMaybe<Scalars['String']['input']>;
  maxShifts?: InputMaybe<Scalars['Int']['input']>;
  memberSkillIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  orgId: Scalars['String']['input'];
  pNumber: Scalars['String']['input'];
  rankId?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<MemberRole>;
  status?: InputMaybe<MemberStatus>;
  tier?: InputMaybe<MemberTier>;
  tierUntil?: InputMaybe<Scalars['String']['input']>;
};

export type NewPhone = {
  number: Scalars['String']['input'];
  receiveTexts: Scalars['Boolean']['input'];
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

export type Organization = {
  __typename?: 'Organization';
  address: Scalars['String']['output'];
  city: Scalars['String']['output'];
  contact?: Maybe<OrganizationContact>;
  createdAt: Scalars['String']['output'];
  docType: DocType;
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  settings?: Maybe<OrganizationOvertimeSettings>;
  state: Scalars['String']['output'];
  timezone: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
  weekBegins: DayOfWeek;
  zip: Scalars['String']['output'];
};

export type OrganizationContact = {
  __typename?: 'OrganizationContact';
  email: Scalars['String']['output'];
  phone: Scalars['String']['output'];
};

export type OrganizationOvertimeSettings = {
  __typename?: 'OrganizationOvertimeSettings';
  lottery: LotterySettings;
  shiftBuffer: ShiftBuffer;
  shiftReminder: ShiftReminder;
  shiftsPerWeek: Scalars['Int']['output'];
  userRelinquishShift: UserRelinquishShift;
};

export type Phone = {
  __typename?: 'Phone';
  number: Scalars['String']['output'];
  receiveTexts: Scalars['Boolean']['output'];
};

export type ProfilePhotoAttachmentUpload = {
  __typename?: 'ProfilePhotoAttachmentUpload';
  imagePath: Scalars['String']['output'];
  uploadUrl: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  activeNotifications?: Maybe<NotificationSearchResult>;
  assignment?: Maybe<Assignment>;
  assignments?: Maybe<AssignmentSearchResult>;
  availableShifts?: Maybe<ShiftSearchResult>;
  event?: Maybe<Event>;
  events?: Maybe<EventSearchResult>;
  groupedShifts?: Maybe<Array<Maybe<Shift>>>;
  health?: Maybe<Scalars['String']['output']>;
  lotteryCounter?: Maybe<LotteryCounter>;
  lotteryCounters?: Maybe<LotteryCounterSearchResult>;
  lotteryShifts?: Maybe<ShiftSearchResult>;
  me?: Maybe<User>;
  memberSkills?: Maybe<MemberSkillSearchResult>;
  notification?: Maybe<Notification>;
  notifications?: Maybe<NotificationSearchResult>;
  organization?: Maybe<Organization>;
  rank?: Maybe<Rank>;
  ranks?: Maybe<RankSearchResult>;
  shift?: Maybe<Shift>;
  shiftBufferRequests?: Maybe<ShiftBufferRequestsSearchResult>;
  shiftLotteryRequests?: Maybe<ShiftLotteryRequestsSearchResult>;
  shiftLottoRequests?: Maybe<ShiftLotteryRequestsSearchResult>;
  shiftUsers?: Maybe<UserSearchResult>;
  shifts?: Maybe<ShiftSearchResult>;
  siteLock?: Maybe<SiteLock>;
  skill?: Maybe<Skill>;
  skills?: Maybe<SkillSearchResult>;
  user?: Maybe<User>;
  users?: Maybe<UserSearchResult>;
  venue?: Maybe<Venue>;
  venues?: Maybe<VenueSearchResult>;
};


export type QueryActiveNotificationsArgs = {
  input?: InputMaybe<SearchInput>;
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


export type QueryEventArgs = {
  id: Scalars['String']['input'];
};


export type QueryEventsArgs = {
  input?: InputMaybe<EventSearchInput>;
};


export type QueryGroupedShiftsArgs = {
  shiftId: Scalars['String']['input'];
};


export type QueryLotteryCounterArgs = {
  counter?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryLotteryCountersArgs = {
  input?: InputMaybe<SearchInput>;
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


export type QueryRankArgs = {
  id: Scalars['String']['input'];
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


export type QueryShiftLotteryRequestsArgs = {
  input?: InputMaybe<ShiftLotteryRequestsSearchInput>;
};


export type QueryShiftLottoRequestsArgs = {
  input: ShiftLottoRequestsSearchInput;
};


export type QueryShiftUsersArgs = {
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};


export type QueryShiftsArgs = {
  input?: InputMaybe<ShiftSearchInput>;
};


export type QuerySkillArgs = {
  id: Scalars['String']['input'];
};


export type QuerySkillsArgs = {
  input?: InputMaybe<SkillSearchInput>;
};


export type QueryUserArgs = {
  id: Scalars['String']['input'];
  shiftStart?: InputMaybe<Scalars['String']['input']>;
  timezoneOffset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUsersArgs = {
  input?: InputMaybe<UserSearchInput>;
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
  id: Scalars['ID']['output'];
  modifiedBy?: Maybe<User>;
  modifiedById?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  org?: Maybe<Organization>;
  orgId: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
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
  createdAt: Scalars['String']['output'];
  createdBy?: Maybe<User>;
  createdById?: Maybe<Scalars['String']['output']>;
  docType: DocType;
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
  shiftId: Scalars['String']['output'];
  startTime: Scalars['String']['output'];
  status: ShiftStatus;
  updatedAt: Scalars['String']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
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

export type ShiftDayTime = {
  __typename?: 'ShiftDayTime';
  endTime: Scalars['String']['output'];
  startTime: Scalars['String']['output'];
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
  description?: InputMaybe<Scalars['String']['input']>;
  eventId: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notifyWhenFullyStaffed?: InputMaybe<Scalars['Boolean']['input']>;
  rankIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  requiredSkillIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  shiftIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type UpsertEvent = {
  assignmentIds: Array<InputMaybe<Scalars['String']['input']>>;
  attachmentPaths?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  createdById?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  lotteryNumber?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  notifyOnFirstComeFirstServe?: InputMaybe<Scalars['Boolean']['input']>;
  notifyWhenFullyStaffed?: InputMaybe<Scalars['Boolean']['input']>;
  scheduledFirstComeFirstServe?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EventStatus>;
  venueId: Scalars['String']['input'];
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
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  settings?: InputMaybe<UpsertOrganizationOvertimeSettings>;
  state?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  weekBegins?: InputMaybe<DayOfWeek>;
  zip?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertOrganizationContact = {
  email: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};

export type UpsertOrganizationOvertimeSettings = {
  lottery: UpsertLotterySettings;
  shiftBuffer: UpsertShiftBuffer;
  shiftReminder: UpsertShiftReminder;
  shiftsPerWeek: Scalars['Int']['input'];
  userRelinquishShift: UpsertUserRelinquishShift;
};

export type UpsertRank = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertShift = {
  assignmentId: Scalars['String']['input'];
  createdById?: InputMaybe<Scalars['String']['input']>;
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

export type UpsertUserRelinquishShift = {
  afterShiftRemove: UpsertAfterShiftRemove;
  enabled: Scalars['Boolean']['input'];
  numberOfHoursBeforeShift: Scalars['Int']['input'];
  requireNoteWhenRelinquishing: Scalars['Boolean']['input'];
};

export type UpsertVenue = {
  address?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contact?: InputMaybe<UpsertVenueContact>;
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

export type Venue = {
  __typename?: 'Venue';
  address?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  contact?: Maybe<VenueContact>;
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
  Removed = 'REMOVED'
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
  AfterShiftRemove: ResolverTypeWrapper<AfterShiftRemove>;
  Assignment: ResolverTypeWrapper<Assignment>;
  AssignmentSearchInput: AssignmentSearchInput;
  AssignmentSearchResult: ResolverTypeWrapper<AssignmentSearchResult>;
  AvailabilityTime: ResolverTypeWrapper<AvailabilityTime>;
  AvailableShiftsSearchInput: AvailableShiftsSearchInput;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BrowserNotificationKeys: ResolverTypeWrapper<BrowserNotificationKeys>;
  BrowserNotificationSetting: ResolverTypeWrapper<BrowserNotificationSetting>;
  BrowserNotificationSubscription: ResolverTypeWrapper<BrowserNotificationSubscription>;
  ContactInfo: ResolverTypeWrapper<ContactInfo>;
  CreateShiftBufferRequest: CreateShiftBufferRequest;
  DayAvailability: ResolverTypeWrapper<DayAvailability>;
  DayOfWeek: DayOfWeek;
  DocType: DocType;
  Email: ResolverTypeWrapper<Email>;
  Event: ResolverTypeWrapper<Event>;
  EventAttachmentUpload: ResolverTypeWrapper<EventAttachmentUpload>;
  EventSearchInput: EventSearchInput;
  EventSearchResult: ResolverTypeWrapper<EventSearchResult>;
  EventStatus: EventStatus;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  InputAdminResetPassword: InputAdminResetPassword;
  InputAvailabilityTime: InputAvailabilityTime;
  InputBrowserNotificationKeys: InputBrowserNotificationKeys;
  InputBrowserNotificationSubscription: InputBrowserNotificationSubscription;
  InputDayAvailability: InputDayAvailability;
  InputUserAvailability: InputUserAvailability;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  InviteMember: InviteMember;
  InviteUser: InviteUser;
  LotteryCounter: ResolverTypeWrapper<LotteryCounter>;
  LotteryCounterSearchResult: ResolverTypeWrapper<LotteryCounterSearchResult>;
  LotteryDate: ResolverTypeWrapper<LotteryDate>;
  LotterySettings: ResolverTypeWrapper<LotterySettings>;
  Member: ResolverTypeWrapper<Member>;
  MemberNotification: ResolverTypeWrapper<MemberNotification>;
  MemberRole: MemberRole;
  MemberSkill: ResolverTypeWrapper<MemberSkill>;
  MemberSkillAttachmentUpload: ResolverTypeWrapper<MemberSkillAttachmentUpload>;
  MemberSkillSearchInput: MemberSkillSearchInput;
  MemberSkillSearchResult: ResolverTypeWrapper<MemberSkillSearchResult>;
  MemberStatus: MemberStatus;
  MemberTier: MemberTier;
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
  Organization: ResolverTypeWrapper<Organization>;
  OrganizationContact: ResolverTypeWrapper<OrganizationContact>;
  OrganizationOvertimeSettings: ResolverTypeWrapper<OrganizationOvertimeSettings>;
  Phone: ResolverTypeWrapper<Phone>;
  ProfilePhotoAttachmentUpload: ResolverTypeWrapper<ProfilePhotoAttachmentUpload>;
  Query: ResolverTypeWrapper<{}>;
  Rank: ResolverTypeWrapper<Rank>;
  RankSearchInput: RankSearchInput;
  RankSearchResult: ResolverTypeWrapper<RankSearchResult>;
  SearchInput: SearchInput;
  SearchTimeFilter: SearchTimeFilter;
  SearchTimeRange: SearchTimeRange;
  Shift: ResolverTypeWrapper<Shift>;
  ShiftAvailabilityTime: ResolverTypeWrapper<ShiftAvailabilityTime>;
  ShiftBuffer: ResolverTypeWrapper<ShiftBuffer>;
  ShiftBufferRequest: ResolverTypeWrapper<ShiftBufferRequest>;
  ShiftBufferRequestStatus: ShiftBufferRequestStatus;
  ShiftBufferRequestsSearchInput: ShiftBufferRequestsSearchInput;
  ShiftBufferRequestsSearchResult: ResolverTypeWrapper<ShiftBufferRequestsSearchResult>;
  ShiftDayTime: ResolverTypeWrapper<ShiftDayTime>;
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
  SiteLock: ResolverTypeWrapper<SiteLock>;
  Skill: ResolverTypeWrapper<Skill>;
  SkillSearchInput: SkillSearchInput;
  SkillSearchResult: ResolverTypeWrapper<SkillSearchResult>;
  SkillStatus: SkillStatus;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  UpdateUser: UpdateUser;
  UpsertAfterShiftRemove: UpsertAfterShiftRemove;
  UpsertAssignment: UpsertAssignment;
  UpsertEvent: UpsertEvent;
  UpsertLotteryDate: UpsertLotteryDate;
  UpsertLotterySettings: UpsertLotterySettings;
  UpsertMemberSkill: UpsertMemberSkill;
  UpsertNotification: UpsertNotification;
  UpsertOrganization: UpsertOrganization;
  UpsertOrganizationContact: UpsertOrganizationContact;
  UpsertOrganizationOvertimeSettings: UpsertOrganizationOvertimeSettings;
  UpsertRank: UpsertRank;
  UpsertShift: UpsertShift;
  UpsertShiftBuffer: UpsertShiftBuffer;
  UpsertShiftLotteryRequest: UpsertShiftLotteryRequest;
  UpsertShiftReminder: UpsertShiftReminder;
  UpsertSiteLock: UpsertSiteLock;
  UpsertSkill: UpsertSkill;
  UpsertUserRelinquishShift: UpsertUserRelinquishShift;
  UpsertVenue: UpsertVenue;
  UpsertVenueContact: UpsertVenueContact;
  User: ResolverTypeWrapper<User>;
  UserAvailability: ResolverTypeWrapper<UserAvailability>;
  UserRelinquishShift: ResolverTypeWrapper<UserRelinquishShift>;
  UserSearchInput: UserSearchInput;
  UserSearchResult: ResolverTypeWrapper<UserSearchResult>;
  Venue: ResolverTypeWrapper<Venue>;
  VenueContact: ResolverTypeWrapper<VenueContact>;
  VenueSearchInput: VenueSearchInput;
  VenueSearchResult: ResolverTypeWrapper<VenueSearchResult>;
  VenueStatus: VenueStatus;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AfterShiftRemove: AfterShiftRemove;
  Assignment: Assignment;
  AssignmentSearchInput: AssignmentSearchInput;
  AssignmentSearchResult: AssignmentSearchResult;
  AvailabilityTime: AvailabilityTime;
  AvailableShiftsSearchInput: AvailableShiftsSearchInput;
  Boolean: Scalars['Boolean']['output'];
  BrowserNotificationKeys: BrowserNotificationKeys;
  BrowserNotificationSetting: BrowserNotificationSetting;
  BrowserNotificationSubscription: BrowserNotificationSubscription;
  ContactInfo: ContactInfo;
  CreateShiftBufferRequest: CreateShiftBufferRequest;
  DayAvailability: DayAvailability;
  Email: Email;
  Event: Event;
  EventAttachmentUpload: EventAttachmentUpload;
  EventSearchInput: EventSearchInput;
  EventSearchResult: EventSearchResult;
  ID: Scalars['ID']['output'];
  InputAdminResetPassword: InputAdminResetPassword;
  InputAvailabilityTime: InputAvailabilityTime;
  InputBrowserNotificationKeys: InputBrowserNotificationKeys;
  InputBrowserNotificationSubscription: InputBrowserNotificationSubscription;
  InputDayAvailability: InputDayAvailability;
  InputUserAvailability: InputUserAvailability;
  Int: Scalars['Int']['output'];
  InviteMember: InviteMember;
  InviteUser: InviteUser;
  LotteryCounter: LotteryCounter;
  LotteryCounterSearchResult: LotteryCounterSearchResult;
  LotteryDate: LotteryDate;
  LotterySettings: LotterySettings;
  Member: Member;
  MemberNotification: MemberNotification;
  MemberSkill: MemberSkill;
  MemberSkillAttachmentUpload: MemberSkillAttachmentUpload;
  MemberSkillSearchInput: MemberSkillSearchInput;
  MemberSkillSearchResult: MemberSkillSearchResult;
  Mutation: {};
  NewContactInfo: NewContactInfo;
  NewEmail: NewEmail;
  NewMember: NewMember;
  NewPhone: NewPhone;
  NewUser: NewUser;
  Notification: Notification;
  NotificationSearchInput: NotificationSearchInput;
  NotificationSearchResult: NotificationSearchResult;
  Organization: Organization;
  OrganizationContact: OrganizationContact;
  OrganizationOvertimeSettings: OrganizationOvertimeSettings;
  Phone: Phone;
  ProfilePhotoAttachmentUpload: ProfilePhotoAttachmentUpload;
  Query: {};
  Rank: Rank;
  RankSearchInput: RankSearchInput;
  RankSearchResult: RankSearchResult;
  SearchInput: SearchInput;
  SearchTimeFilter: SearchTimeFilter;
  SearchTimeRange: SearchTimeRange;
  Shift: Shift;
  ShiftAvailabilityTime: ShiftAvailabilityTime;
  ShiftBuffer: ShiftBuffer;
  ShiftBufferRequest: ShiftBufferRequest;
  ShiftBufferRequestsSearchInput: ShiftBufferRequestsSearchInput;
  ShiftBufferRequestsSearchResult: ShiftBufferRequestsSearchResult;
  ShiftDayTime: ShiftDayTime;
  ShiftLotteryRequest: ShiftLotteryRequest;
  ShiftLotteryRequestsSearchInput: ShiftLotteryRequestsSearchInput;
  ShiftLotteryRequestsSearchResult: ShiftLotteryRequestsSearchResult;
  ShiftLottoRequestsSearchInput: ShiftLottoRequestsSearchInput;
  ShiftReminder: ShiftReminder;
  ShiftSearchInput: ShiftSearchInput;
  ShiftSearchResult: ShiftSearchResult;
  SiteLock: SiteLock;
  Skill: Skill;
  SkillSearchInput: SkillSearchInput;
  SkillSearchResult: SkillSearchResult;
  String: Scalars['String']['output'];
  UpdateUser: UpdateUser;
  UpsertAfterShiftRemove: UpsertAfterShiftRemove;
  UpsertAssignment: UpsertAssignment;
  UpsertEvent: UpsertEvent;
  UpsertLotteryDate: UpsertLotteryDate;
  UpsertLotterySettings: UpsertLotterySettings;
  UpsertMemberSkill: UpsertMemberSkill;
  UpsertNotification: UpsertNotification;
  UpsertOrganization: UpsertOrganization;
  UpsertOrganizationContact: UpsertOrganizationContact;
  UpsertOrganizationOvertimeSettings: UpsertOrganizationOvertimeSettings;
  UpsertRank: UpsertRank;
  UpsertShift: UpsertShift;
  UpsertShiftBuffer: UpsertShiftBuffer;
  UpsertShiftLotteryRequest: UpsertShiftLotteryRequest;
  UpsertShiftReminder: UpsertShiftReminder;
  UpsertSiteLock: UpsertSiteLock;
  UpsertSkill: UpsertSkill;
  UpsertUserRelinquishShift: UpsertUserRelinquishShift;
  UpsertVenue: UpsertVenue;
  UpsertVenueContact: UpsertVenueContact;
  User: User;
  UserAvailability: UserAvailability;
  UserRelinquishShift: UserRelinquishShift;
  UserSearchInput: UserSearchInput;
  UserSearchResult: UserSearchResult;
  Venue: Venue;
  VenueContact: VenueContact;
  VenueSearchInput: VenueSearchInput;
  VenueSearchResult: VenueSearchResult;
}>;

export type AfterShiftRemoveResolvers<ContextType = any, ParentType extends ResolversParentTypes['AfterShiftRemove'] = ResolversParentTypes['AfterShiftRemove']> = ResolversObject<{
  days?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  tier?: Resolver<ResolversTypes['MemberTier'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AssignmentResolvers<ContextType = any, ParentType extends ResolversParentTypes['Assignment'] = ResolversParentTypes['Assignment']> = ResolversObject<{
  availableShifts?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  bwNeeded?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  event?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  eventId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notifyWhenFullyStaffed?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rankIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  ranks?: Resolver<Maybe<Array<Maybe<ResolversTypes['Rank']>>>, ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  requiredSkillIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  requiredSkills?: Resolver<Maybe<Array<Maybe<ResolversTypes['Skill']>>>, ParentType, ContextType>;
  shiftIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  shifts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Shift']>>>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AssignmentSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['AssignmentSearchResult'] = ResolversParentTypes['AssignmentSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Assignment']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
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
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  subscription?: Resolver<ResolversTypes['BrowserNotificationSubscription'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BrowserNotificationSubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['BrowserNotificationSubscription'] = ResolversParentTypes['BrowserNotificationSubscription']> = ResolversObject<{
  endpoint?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  expirationTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  keys?: Resolver<ResolversTypes['BrowserNotificationKeys'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ContactInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContactInfo'] = ResolversParentTypes['ContactInfo']> = ResolversObject<{
  primaryEmail?: Resolver<ResolversTypes['Email'], ParentType, ContextType>;
  primaryPhone?: Resolver<ResolversTypes['Phone'], ParentType, ContextType>;
  secondaryEmail?: Resolver<Maybe<ResolversTypes['Email']>, ParentType, ContextType>;
  secondaryPhone?: Resolver<Maybe<ResolversTypes['Phone']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DayAvailabilityResolvers<ContextType = any, ParentType extends ResolversParentTypes['DayAvailability'] = ResolversParentTypes['DayAvailability']> = ResolversObject<{
  available?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  times?: Resolver<Maybe<Array<ResolversTypes['AvailabilityTime']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailResolvers<ContextType = any, ParentType extends ResolversParentTypes['Email'] = ResolversParentTypes['Email']> = ResolversObject<{
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  receiveEmails?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventResolvers<ContextType = any, ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']> = ResolversObject<{
  assignmentIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  assignments?: Resolver<Maybe<Array<ResolversTypes['Assignment']>>, ParentType, ContextType>;
  attachmentPaths?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  attachments?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  availableShifts?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  createdById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  endTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lotteryCounter?: Resolver<Maybe<ResolversTypes['LotteryCounter']>, ParentType, ContextType>;
  lotteryNumber?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  notes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  notifyOnFirstComeFirstServe?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  notifyWhenFullyStaffed?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  referenceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  scheduledFirstComeFirstServe?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  searchAttribute?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['EventStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  venue?: Resolver<Maybe<ResolversTypes['Venue']>, ParentType, ContextType>;
  venueId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventAttachmentUploadResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventAttachmentUpload'] = ResolversParentTypes['EventAttachmentUpload']> = ResolversObject<{
  attachmentPath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uploadUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventSearchResult'] = ResolversParentTypes['EventSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
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

export type MemberResolvers<ContextType = any, ParentType extends ResolversParentTypes['Member'] = ResolversParentTypes['Member']> = ResolversObject<{
  adminNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  availability?: Resolver<ResolversTypes['UserAvailability'], ParentType, ContextType>;
  contactInfo?: Resolver<Maybe<ResolversTypes['ContactInfo']>, ParentType, ContextType>;
  deactivationNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  inactivateUntil?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  inactivationNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  maxShifts?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  memberSkillIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  memberSkills?: Resolver<Maybe<Array<Maybe<ResolversTypes['MemberSkill']>>>, ParentType, ContextType>;
  org?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rank?: Resolver<Maybe<ResolversTypes['Rank']>, ParentType, ContextType>;
  rankId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  role?: Resolver<Maybe<ResolversTypes['MemberRole']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['MemberStatus']>, ParentType, ContextType>;
  tier?: Resolver<Maybe<ResolversTypes['MemberTier']>, ParentType, ContextType>;
  tierResetOnNextLottery?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  tierUntil?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  adminEditPassword?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationAdminEditPasswordArgs, 'input'>>;
  approveLottoAssignment?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationApproveLottoAssignmentArgs, 'id' | 'shiftId' | 'userId'>>;
  assignment?: Resolver<Maybe<ResolversTypes['Assignment']>, ParentType, ContextType, RequireFields<MutationAssignmentArgs, 'assignment'>>;
  browserNotificationSubscription?: Resolver<Maybe<ResolversTypes['BrowserNotificationSetting']>, ParentType, ContextType, RequireFields<MutationBrowserNotificationSubscriptionArgs, 'input'>>;
  event?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<MutationEventArgs, 'event'>>;
  eventAttachmentUploadUrl?: Resolver<Maybe<ResolversTypes['EventAttachmentUpload']>, ParentType, ContextType>;
  inviteUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationInviteUserArgs, 'user'>>;
  newUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationNewUserArgs, 'user'>>;
  notification?: Resolver<Maybe<ResolversTypes['Notification']>, ParentType, ContextType, RequireFields<MutationNotificationArgs, 'notification'>>;
  notifyUsersOfEvent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationNotifyUsersOfEventArgs, 'eventId'>>;
  notifyUsersOfShift?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationNotifyUsersOfShiftArgs, 'shiftId'>>;
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType, RequireFields<MutationOrganizationArgs, 'organization'>>;
  profilePhotoUploadUrl?: Resolver<Maybe<ResolversTypes['ProfilePhotoAttachmentUpload']>, ParentType, ContextType>;
  rank?: Resolver<Maybe<ResolversTypes['Rank']>, ParentType, ContextType, RequireFields<MutationRankArgs, 'rank'>>;
  rejectLottoAssignment?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationRejectLottoAssignmentArgs, 'id' | 'shiftId' | 'userId'>>;
  removeAssignment?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveAssignmentArgs, 'id'>>;
  removeEvent?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveEventArgs, 'id'>>;
  removeNotification?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveNotificationArgs, 'id'>>;
  removeRank?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveRankArgs, 'id'>>;
  removeShift?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveShiftArgs, 'id'>>;
  removeShiftBufferRequest?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveShiftBufferRequestArgs, 'id'>>;
  removeShiftLotteryRequest?: Resolver<ResolversTypes['ID'], ParentType, ContextType, Partial<MutationRemoveShiftLotteryRequestArgs>>;
  removeShifts?: Resolver<Array<Maybe<ResolversTypes['String']>>, ParentType, ContextType, RequireFields<MutationRemoveShiftsArgs, 'shiftId'>>;
  removeSkill?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveSkillArgs, 'id'>>;
  removeUser?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveUserArgs, 'id'>>;
  removeUserSkill?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveUserSkillArgs, 'id'>>;
  removeVenue?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveVenueArgs, 'id'>>;
  seenNotifications?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationSeenNotificationsArgs, 'notificationIds'>>;
  setShiftBufferStatus?: Resolver<Maybe<ResolversTypes['ShiftBufferRequest']>, ParentType, ContextType, RequireFields<MutationSetShiftBufferStatusArgs, 'id' | 'status'>>;
  shiftAssign?: Resolver<Maybe<ResolversTypes['Shift']>, ParentType, ContextType, RequireFields<MutationShiftAssignArgs, 'id'>>;
  shiftBufferRequest?: Resolver<Maybe<ResolversTypes['ShiftBufferRequest']>, ParentType, ContextType, Partial<MutationShiftBufferRequestArgs>>;
  shiftLotteryRequest?: Resolver<Maybe<ResolversTypes['ShiftLotteryRequest']>, ParentType, ContextType, Partial<MutationShiftLotteryRequestArgs>>;
  shifts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Shift']>>>, ParentType, ContextType, RequireFields<MutationShiftsArgs, 'shifts'>>;
  siteLock?: Resolver<Maybe<ResolversTypes['SiteLock']>, ParentType, ContextType, Partial<MutationSiteLockArgs>>;
  skill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<MutationSkillArgs, 'skill'>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationUserArgs, 'user'>>;
  userSkill?: Resolver<Maybe<ResolversTypes['MemberSkill']>, ParentType, ContextType, RequireFields<MutationUserSkillArgs, 'userSkill'>>;
  userSkillAttachmentUploadUrl?: Resolver<Maybe<ResolversTypes['MemberSkillAttachmentUpload']>, ParentType, ContextType>;
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

export type OrganizationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Organization'] = ResolversParentTypes['Organization']> = ResolversObject<{
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  city?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  contact?: Resolver<Maybe<ResolversTypes['OrganizationContact']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  modifiedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  modifiedById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  removedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  settings?: Resolver<Maybe<ResolversTypes['OrganizationOvertimeSettings']>, ParentType, ContextType>;
  state?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  weekBegins?: Resolver<ResolversTypes['DayOfWeek'], ParentType, ContextType>;
  zip?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationContactResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationContact'] = ResolversParentTypes['OrganizationContact']> = ResolversObject<{
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  phone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationOvertimeSettingsResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationOvertimeSettings'] = ResolversParentTypes['OrganizationOvertimeSettings']> = ResolversObject<{
  lottery?: Resolver<ResolversTypes['LotterySettings'], ParentType, ContextType>;
  shiftBuffer?: Resolver<ResolversTypes['ShiftBuffer'], ParentType, ContextType>;
  shiftReminder?: Resolver<ResolversTypes['ShiftReminder'], ParentType, ContextType>;
  shiftsPerWeek?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  userRelinquishShift?: Resolver<ResolversTypes['UserRelinquishShift'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PhoneResolvers<ContextType = any, ParentType extends ResolversParentTypes['Phone'] = ResolversParentTypes['Phone']> = ResolversObject<{
  number?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  receiveTexts?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProfilePhotoAttachmentUploadResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProfilePhotoAttachmentUpload'] = ResolversParentTypes['ProfilePhotoAttachmentUpload']> = ResolversObject<{
  imagePath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uploadUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  activeNotifications?: Resolver<Maybe<ResolversTypes['NotificationSearchResult']>, ParentType, ContextType, Partial<QueryActiveNotificationsArgs>>;
  assignment?: Resolver<Maybe<ResolversTypes['Assignment']>, ParentType, ContextType, RequireFields<QueryAssignmentArgs, 'id'>>;
  assignments?: Resolver<Maybe<ResolversTypes['AssignmentSearchResult']>, ParentType, ContextType, Partial<QueryAssignmentsArgs>>;
  availableShifts?: Resolver<Maybe<ResolversTypes['ShiftSearchResult']>, ParentType, ContextType, Partial<QueryAvailableShiftsArgs>>;
  event?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<QueryEventArgs, 'id'>>;
  events?: Resolver<Maybe<ResolversTypes['EventSearchResult']>, ParentType, ContextType, Partial<QueryEventsArgs>>;
  groupedShifts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Shift']>>>, ParentType, ContextType, RequireFields<QueryGroupedShiftsArgs, 'shiftId'>>;
  health?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lotteryCounter?: Resolver<Maybe<ResolversTypes['LotteryCounter']>, ParentType, ContextType, Partial<QueryLotteryCounterArgs>>;
  lotteryCounters?: Resolver<Maybe<ResolversTypes['LotteryCounterSearchResult']>, ParentType, ContextType, Partial<QueryLotteryCountersArgs>>;
  lotteryShifts?: Resolver<Maybe<ResolversTypes['ShiftSearchResult']>, ParentType, ContextType>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  memberSkills?: Resolver<Maybe<ResolversTypes['MemberSkillSearchResult']>, ParentType, ContextType, Partial<QueryMemberSkillsArgs>>;
  notification?: Resolver<Maybe<ResolversTypes['Notification']>, ParentType, ContextType, RequireFields<QueryNotificationArgs, 'id'>>;
  notifications?: Resolver<Maybe<ResolversTypes['NotificationSearchResult']>, ParentType, ContextType, Partial<QueryNotificationsArgs>>;
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  rank?: Resolver<Maybe<ResolversTypes['Rank']>, ParentType, ContextType, RequireFields<QueryRankArgs, 'id'>>;
  ranks?: Resolver<Maybe<ResolversTypes['RankSearchResult']>, ParentType, ContextType, Partial<QueryRanksArgs>>;
  shift?: Resolver<Maybe<ResolversTypes['Shift']>, ParentType, ContextType, RequireFields<QueryShiftArgs, 'id'>>;
  shiftBufferRequests?: Resolver<Maybe<ResolversTypes['ShiftBufferRequestsSearchResult']>, ParentType, ContextType, Partial<QueryShiftBufferRequestsArgs>>;
  shiftLotteryRequests?: Resolver<Maybe<ResolversTypes['ShiftLotteryRequestsSearchResult']>, ParentType, ContextType, Partial<QueryShiftLotteryRequestsArgs>>;
  shiftLottoRequests?: Resolver<Maybe<ResolversTypes['ShiftLotteryRequestsSearchResult']>, ParentType, ContextType, RequireFields<QueryShiftLottoRequestsArgs, 'input'>>;
  shiftUsers?: Resolver<Maybe<ResolversTypes['UserSearchResult']>, ParentType, ContextType, RequireFields<QueryShiftUsersArgs, 'id'>>;
  shifts?: Resolver<Maybe<ResolversTypes['ShiftSearchResult']>, ParentType, ContextType, Partial<QueryShiftsArgs>>;
  siteLock?: Resolver<Maybe<ResolversTypes['SiteLock']>, ParentType, ContextType>;
  skill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<QuerySkillArgs, 'id'>>;
  skills?: Resolver<Maybe<ResolversTypes['SkillSearchResult']>, ParentType, ContextType, Partial<QuerySkillsArgs>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'id'>>;
  users?: Resolver<Maybe<ResolversTypes['UserSearchResult']>, ParentType, ContextType, Partial<QueryUsersArgs>>;
  venue?: Resolver<Maybe<ResolversTypes['Venue']>, ParentType, ContextType, RequireFields<QueryVenueArgs, 'id'>>;
  venues?: Resolver<Maybe<ResolversTypes['VenueSearchResult']>, ParentType, ContextType, Partial<QueryVenuesArgs>>;
}>;

export type RankResolvers<ContextType = any, ParentType extends ResolversParentTypes['Rank'] = ResolversParentTypes['Rank']> = ResolversObject<{
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

export type RankSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['RankSearchResult'] = ResolversParentTypes['RankSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Rank']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShiftResolvers<ContextType = any, ParentType extends ResolversParentTypes['Shift'] = ResolversParentTypes['Shift']> = ResolversObject<{
  assignment?: Resolver<ResolversTypes['Assignment'], ParentType, ContextType>;
  assignmentId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  availability?: Resolver<Maybe<ResolversTypes['ShiftAvailabilityTime']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  createdById?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
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
  shiftId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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

export type ShiftDayTimeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShiftDayTime'] = ResolversParentTypes['ShiftDayTime']> = ResolversObject<{
  endTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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

export type VenueResolvers<ContextType = any, ParentType extends ResolversParentTypes['Venue'] = ResolversParentTypes['Venue']> = ResolversObject<{
  address?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  city?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  contact?: Resolver<Maybe<ResolversTypes['VenueContact']>, ParentType, ContextType>;
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

export type VenueSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['VenueSearchResult'] = ResolversParentTypes['VenueSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Venue']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  AfterShiftRemove?: AfterShiftRemoveResolvers<ContextType>;
  Assignment?: AssignmentResolvers<ContextType>;
  AssignmentSearchResult?: AssignmentSearchResultResolvers<ContextType>;
  AvailabilityTime?: AvailabilityTimeResolvers<ContextType>;
  BrowserNotificationKeys?: BrowserNotificationKeysResolvers<ContextType>;
  BrowserNotificationSetting?: BrowserNotificationSettingResolvers<ContextType>;
  BrowserNotificationSubscription?: BrowserNotificationSubscriptionResolvers<ContextType>;
  ContactInfo?: ContactInfoResolvers<ContextType>;
  DayAvailability?: DayAvailabilityResolvers<ContextType>;
  Email?: EmailResolvers<ContextType>;
  Event?: EventResolvers<ContextType>;
  EventAttachmentUpload?: EventAttachmentUploadResolvers<ContextType>;
  EventSearchResult?: EventSearchResultResolvers<ContextType>;
  LotteryCounter?: LotteryCounterResolvers<ContextType>;
  LotteryCounterSearchResult?: LotteryCounterSearchResultResolvers<ContextType>;
  LotteryDate?: LotteryDateResolvers<ContextType>;
  LotterySettings?: LotterySettingsResolvers<ContextType>;
  Member?: MemberResolvers<ContextType>;
  MemberNotification?: MemberNotificationResolvers<ContextType>;
  MemberSkill?: MemberSkillResolvers<ContextType>;
  MemberSkillAttachmentUpload?: MemberSkillAttachmentUploadResolvers<ContextType>;
  MemberSkillSearchResult?: MemberSkillSearchResultResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Notification?: NotificationResolvers<ContextType>;
  NotificationSearchResult?: NotificationSearchResultResolvers<ContextType>;
  Organization?: OrganizationResolvers<ContextType>;
  OrganizationContact?: OrganizationContactResolvers<ContextType>;
  OrganizationOvertimeSettings?: OrganizationOvertimeSettingsResolvers<ContextType>;
  Phone?: PhoneResolvers<ContextType>;
  ProfilePhotoAttachmentUpload?: ProfilePhotoAttachmentUploadResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Rank?: RankResolvers<ContextType>;
  RankSearchResult?: RankSearchResultResolvers<ContextType>;
  Shift?: ShiftResolvers<ContextType>;
  ShiftAvailabilityTime?: ShiftAvailabilityTimeResolvers<ContextType>;
  ShiftBuffer?: ShiftBufferResolvers<ContextType>;
  ShiftBufferRequest?: ShiftBufferRequestResolvers<ContextType>;
  ShiftBufferRequestsSearchResult?: ShiftBufferRequestsSearchResultResolvers<ContextType>;
  ShiftDayTime?: ShiftDayTimeResolvers<ContextType>;
  ShiftLotteryRequest?: ShiftLotteryRequestResolvers<ContextType>;
  ShiftLotteryRequestsSearchResult?: ShiftLotteryRequestsSearchResultResolvers<ContextType>;
  ShiftReminder?: ShiftReminderResolvers<ContextType>;
  ShiftSearchResult?: ShiftSearchResultResolvers<ContextType>;
  SiteLock?: SiteLockResolvers<ContextType>;
  Skill?: SkillResolvers<ContextType>;
  SkillSearchResult?: SkillSearchResultResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserAvailability?: UserAvailabilityResolvers<ContextType>;
  UserRelinquishShift?: UserRelinquishShiftResolvers<ContextType>;
  UserSearchResult?: UserSearchResultResolvers<ContextType>;
  Venue?: VenueResolvers<ContextType>;
  VenueContact?: VenueContactResolvers<ContextType>;
  VenueSearchResult?: VenueSearchResultResolvers<ContextType>;
}>;

