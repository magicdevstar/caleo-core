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

export type Assignment = {
  __typename?: 'Assignment';
  bwNeeded: Scalars['Boolean']['output'];
  description?: Maybe<Scalars['String']['output']>;
  docType: DocType;
  event: Event;
  eventId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  orgId: Scalars['String']['output'];
  rankIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  ranks?: Maybe<Array<Maybe<Rank>>>;
  requiredSkillIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  requiredSkills?: Maybe<Array<Maybe<Skill>>>;
  shiftIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  shifts?: Maybe<Array<Maybe<Shift>>>;
};

export type ContactInfo = {
  __typename?: 'ContactInfo';
  primaryEmail: Email;
  primaryPhone: Phone;
  secondaryEmail?: Maybe<Email>;
  secondaryPhone?: Maybe<Phone>;
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
  MemberNotification = 'MEMBER_NOTIFICATION',
  MemberSkill = 'MEMBER_SKILL',
  Notification = 'NOTIFICATION',
  Organization = 'ORGANIZATION',
  Rank = 'RANK',
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
  assignments?: Maybe<Array<Maybe<Assignment>>>;
  attachment: Scalars['String']['output'];
  docType: DocType;
  endDate: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  org: Organization;
  orgId: Scalars['String']['output'];
  startDate: Scalars['String']['output'];
  status: EventStatus;
};

export enum EventStatus {
  Closed = 'CLOSED',
  Fcfs = 'FCFS',
  InProgress = 'IN_PROGRESS',
  Lottery = 'LOTTERY',
  Pending = 'PENDING',
  PostLottery = 'POST_LOTTERY',
  PreFcfs = 'PRE_FCFS',
  PreLottery = 'PRE_LOTTERY',
  Removed = 'REMOVED'
}

export type Member = {
  __typename?: 'Member';
  adminNote?: Maybe<Scalars['String']['output']>;
  contactInfo?: Maybe<ContactInfo>;
  deactivationNote?: Maybe<Scalars['String']['output']>;
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
  imagePath: Scalars['String']['output'];
  orgId: Scalars['String']['output'];
  skill: Skill;
  skillId: Scalars['String']['output'];
  status: SkillStatus;
  updatedAt: Scalars['String']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export enum MemberStatus {
  Active = 'ACTIVE',
  Deleted = 'DELETED',
  Inactive = 'INACTIVE',
  Pending = 'PENDING',
  Removed = 'REMOVED'
}

export enum MemberTier {
  Tier_1 = 'TIER_1',
  Tier_2 = 'TIER_2'
}

export type Mutation = {
  __typename?: 'Mutation';
  newUser?: Maybe<User>;
  notification?: Maybe<Notification>;
  organization?: Maybe<Organization>;
  rank?: Maybe<Rank>;
  removeNotification: Scalars['ID']['output'];
  removeRank: Scalars['ID']['output'];
  removeSkill: Scalars['ID']['output'];
  removeUserSkill: Scalars['ID']['output'];
  removeVenue: Scalars['ID']['output'];
  seenNotifications?: Maybe<Scalars['Boolean']['output']>;
  skill?: Maybe<Skill>;
  user?: Maybe<User>;
  userSkill?: Maybe<MemberSkill>;
  venue?: Maybe<Venue>;
};


export type MutationNewUserArgs = {
  user: NewUser;
};


export type MutationNotificationArgs = {
  notification: UpsertNotification;
};


export type MutationOrganizationArgs = {
  org: NewOrganization;
};


export type MutationRankArgs = {
  rank: UpsertRank;
};


export type MutationRemoveNotificationArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveRankArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveSkillArgs = {
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
  contactInfo?: InputMaybe<NewContactInfo>;
  deactivationNote?: InputMaybe<Scalars['String']['input']>;
  memberSkillIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  orgId: Scalars['String']['input'];
  pNumber: Scalars['String']['input'];
  rankId?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<MemberRole>;
  status?: InputMaybe<MemberStatus>;
  tier?: InputMaybe<MemberTier>;
};

export type NewOrganization = {
  address: Scalars['String']['input'];
  city: Scalars['String']['input'];
  contact?: InputMaybe<NewOrganizationContact>;
  name: Scalars['String']['input'];
  state: Scalars['String']['input'];
  timezone: Scalars['String']['input'];
  weekBegins: DayOfWeek;
};

export type NewOrganizationContact = {
  email: Scalars['String']['input'];
  phone: Scalars['String']['input'];
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
  createdBy: User;
  createdById: Scalars['String']['output'];
  docType: DocType;
  frequency: NotificationFrequency;
  id: Scalars['ID']['output'];
  memberNotification?: Maybe<MemberNotification>;
  org: Organization;
  orgId: Scalars['String']['output'];
  rankIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  ranks: Array<Maybe<Rank>>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export enum NotificationFrequency {
  Always = 'ALWAYS',
  Once = 'ONCE',
  UntilExpire = 'UNTIL_EXPIRE'
}

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
  name: Scalars['String']['output'];
  state: Scalars['String']['output'];
  timezone: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
  weekBegins: DayOfWeek;
};

export type OrganizationContact = {
  __typename?: 'OrganizationContact';
  email: Scalars['String']['output'];
  phone: Scalars['String']['output'];
};

export type Phone = {
  __typename?: 'Phone';
  number: Scalars['String']['output'];
  receiveTexts: Scalars['Boolean']['output'];
};

export type Query = {
  __typename?: 'Query';
  activeNotifications?: Maybe<NotificationSearchResult>;
  health?: Maybe<Scalars['String']['output']>;
  me?: Maybe<User>;
  notification?: Maybe<Notification>;
  notifications?: Maybe<NotificationSearchResult>;
  rank?: Maybe<Rank>;
  ranks?: Maybe<RankSearchResult>;
  skill?: Maybe<Skill>;
  skills?: Maybe<SkillSearchResult>;
  users?: Maybe<UserSearchResult>;
  venue?: Maybe<Venue>;
  venues?: Maybe<VenueSearchResult>;
};


export type QueryActiveNotificationsArgs = {
  input?: InputMaybe<SearchInput>;
};


export type QueryNotificationArgs = {
  id: Scalars['String']['input'];
};


export type QueryNotificationsArgs = {
  input?: InputMaybe<SearchInput>;
};


export type QueryRankArgs = {
  id: Scalars['String']['input'];
};


export type QueryRanksArgs = {
  input?: InputMaybe<SearchInput>;
};


export type QuerySkillArgs = {
  id: Scalars['String']['input'];
};


export type QuerySkillsArgs = {
  input?: InputMaybe<SearchInput>;
};


export type QueryUsersArgs = {
  input?: InputMaybe<SearchInput>;
};


export type QueryVenueArgs = {
  id: Scalars['String']['input'];
};


export type QueryVenuesArgs = {
  input?: InputMaybe<SearchInput>;
};

export type Rank = {
  __typename?: 'Rank';
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  docType: DocType;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  org?: Maybe<Organization>;
  orgId: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type RankSearchResult = {
  __typename?: 'RankSearchResult';
  items?: Maybe<Array<Maybe<Rank>>>;
  total: Scalars['Int']['output'];
};

export type SearchInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type Shift = {
  __typename?: 'Shift';
  assignment: Assignment;
  assignmentId: Scalars['String']['output'];
  docType: DocType;
  endTime: Scalars['String']['output'];
  event: Event;
  eventId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  locked: Scalars['Boolean']['output'];
  shiftId: Scalars['String']['output'];
  startTime: Scalars['String']['output'];
  status: ShiftStatus;
  user: User;
  userId: Scalars['String']['output'];
};

export enum ShiftStatus {
  Assigned = 'ASSIGNED',
  Available = 'AVAILABLE',
  Locked = 'LOCKED',
  Pending = 'PENDING',
  Relinquished = 'RELINQUISHED',
  Removed = 'REMOVED',
  Secured = 'SECURED',
  Started = 'STARTED',
  Unfulfilled = 'UNFULFILLED',
  Unsecured = 'UNSECURED'
}

export type Skill = {
  __typename?: 'Skill';
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  docType: DocType;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  org: Organization;
  orgId: Scalars['String']['output'];
  rankOnlyIds?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  ranksOnly?: Maybe<Array<Maybe<Rank>>>;
  requiresAdminApproval: Scalars['Boolean']['output'];
  requiresCert: Scalars['Boolean']['output'];
  updatedAt: Scalars['String']['output'];
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
  lastName: Scalars['String']['input'];
  member?: InputMaybe<NewMember>;
};

export type UpsertMemberSkill = {
  id?: InputMaybe<Scalars['String']['input']>;
  imagePath?: InputMaybe<Scalars['String']['input']>;
  skillId: Scalars['String']['input'];
  status?: InputMaybe<SkillStatus>;
  userId: Scalars['String']['input'];
};

export type UpsertNotification = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  body?: InputMaybe<Scalars['String']['input']>;
  frequency?: InputMaybe<NotificationFrequency>;
  id?: InputMaybe<Scalars['String']['input']>;
  rankIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  title: Scalars['String']['input'];
};

export type UpsertRank = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertSkill = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  rankOnlyIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  requiresAdminApproval?: InputMaybe<Scalars['Boolean']['input']>;
  requiresCert?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpsertVenue = {
  address?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contact?: InputMaybe<UpsertVenueContact>;
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
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
  cognitoId: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  docType: DocType;
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
  member: Member;
  superAdmin: Scalars['Boolean']['output'];
  updatedAt: Scalars['String']['output'];
};

export type UserAvailability = {
  __typename?: 'UserAvailability';
  dayOfWeek: DayOfWeek;
  endTime: Scalars['String']['output'];
  startTime: Scalars['String']['output'];
  unavailable: Scalars['Boolean']['output'];
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export type UserSearchResult = {
  __typename?: 'UserSearchResult';
  items?: Maybe<Array<Maybe<User>>>;
  total: Scalars['Int']['output'];
};

export type Venue = {
  __typename?: 'Venue';
  address: Scalars['String']['output'];
  city: Scalars['String']['output'];
  contact?: Maybe<VenueContact>;
  createdAt: Scalars['String']['output'];
  docType: DocType;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  org: Organization;
  orgId: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  state: Scalars['String']['output'];
  status?: Maybe<VenueStatus>;
  updatedAt: Scalars['String']['output'];
  zip: Scalars['String']['output'];
};

export type VenueContact = {
  __typename?: 'VenueContact';
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
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
  Assignment: ResolverTypeWrapper<Assignment>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  ContactInfo: ResolverTypeWrapper<ContactInfo>;
  DayOfWeek: DayOfWeek;
  DocType: DocType;
  Email: ResolverTypeWrapper<Email>;
  Event: ResolverTypeWrapper<Event>;
  EventStatus: EventStatus;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Member: ResolverTypeWrapper<Member>;
  MemberNotification: ResolverTypeWrapper<MemberNotification>;
  MemberRole: MemberRole;
  MemberSkill: ResolverTypeWrapper<MemberSkill>;
  MemberStatus: MemberStatus;
  MemberTier: MemberTier;
  Mutation: ResolverTypeWrapper<{}>;
  NewContactInfo: NewContactInfo;
  NewEmail: NewEmail;
  NewMember: NewMember;
  NewOrganization: NewOrganization;
  NewOrganizationContact: NewOrganizationContact;
  NewPhone: NewPhone;
  NewUser: NewUser;
  Notification: ResolverTypeWrapper<Notification>;
  NotificationFrequency: NotificationFrequency;
  NotificationSearchResult: ResolverTypeWrapper<NotificationSearchResult>;
  Organization: ResolverTypeWrapper<Organization>;
  OrganizationContact: ResolverTypeWrapper<OrganizationContact>;
  Phone: ResolverTypeWrapper<Phone>;
  Query: ResolverTypeWrapper<{}>;
  Rank: ResolverTypeWrapper<Rank>;
  RankSearchResult: ResolverTypeWrapper<RankSearchResult>;
  SearchInput: SearchInput;
  Shift: ResolverTypeWrapper<Shift>;
  ShiftStatus: ShiftStatus;
  Skill: ResolverTypeWrapper<Skill>;
  SkillSearchResult: ResolverTypeWrapper<SkillSearchResult>;
  SkillStatus: SkillStatus;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  UpdateUser: UpdateUser;
  UpsertMemberSkill: UpsertMemberSkill;
  UpsertNotification: UpsertNotification;
  UpsertRank: UpsertRank;
  UpsertSkill: UpsertSkill;
  UpsertVenue: UpsertVenue;
  UpsertVenueContact: UpsertVenueContact;
  User: ResolverTypeWrapper<User>;
  UserAvailability: ResolverTypeWrapper<UserAvailability>;
  UserSearchResult: ResolverTypeWrapper<UserSearchResult>;
  Venue: ResolverTypeWrapper<Venue>;
  VenueContact: ResolverTypeWrapper<VenueContact>;
  VenueSearchResult: ResolverTypeWrapper<VenueSearchResult>;
  VenueStatus: VenueStatus;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Assignment: Assignment;
  Boolean: Scalars['Boolean']['output'];
  ContactInfo: ContactInfo;
  Email: Email;
  Event: Event;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Member: Member;
  MemberNotification: MemberNotification;
  MemberSkill: MemberSkill;
  Mutation: {};
  NewContactInfo: NewContactInfo;
  NewEmail: NewEmail;
  NewMember: NewMember;
  NewOrganization: NewOrganization;
  NewOrganizationContact: NewOrganizationContact;
  NewPhone: NewPhone;
  NewUser: NewUser;
  Notification: Notification;
  NotificationSearchResult: NotificationSearchResult;
  Organization: Organization;
  OrganizationContact: OrganizationContact;
  Phone: Phone;
  Query: {};
  Rank: Rank;
  RankSearchResult: RankSearchResult;
  SearchInput: SearchInput;
  Shift: Shift;
  Skill: Skill;
  SkillSearchResult: SkillSearchResult;
  String: Scalars['String']['output'];
  UpdateUser: UpdateUser;
  UpsertMemberSkill: UpsertMemberSkill;
  UpsertNotification: UpsertNotification;
  UpsertRank: UpsertRank;
  UpsertSkill: UpsertSkill;
  UpsertVenue: UpsertVenue;
  UpsertVenueContact: UpsertVenueContact;
  User: User;
  UserAvailability: UserAvailability;
  UserSearchResult: UserSearchResult;
  Venue: Venue;
  VenueContact: VenueContact;
  VenueSearchResult: VenueSearchResult;
}>;

export type AssignmentResolvers<ContextType = any, ParentType extends ResolversParentTypes['Assignment'] = ResolversParentTypes['Assignment']> = ResolversObject<{
  bwNeeded?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  event?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  eventId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rankIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  ranks?: Resolver<Maybe<Array<Maybe<ResolversTypes['Rank']>>>, ParentType, ContextType>;
  requiredSkillIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  requiredSkills?: Resolver<Maybe<Array<Maybe<ResolversTypes['Skill']>>>, ParentType, ContextType>;
  shiftIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  shifts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Shift']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ContactInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContactInfo'] = ResolversParentTypes['ContactInfo']> = ResolversObject<{
  primaryEmail?: Resolver<ResolversTypes['Email'], ParentType, ContextType>;
  primaryPhone?: Resolver<ResolversTypes['Phone'], ParentType, ContextType>;
  secondaryEmail?: Resolver<Maybe<ResolversTypes['Email']>, ParentType, ContextType>;
  secondaryPhone?: Resolver<Maybe<ResolversTypes['Phone']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailResolvers<ContextType = any, ParentType extends ResolversParentTypes['Email'] = ResolversParentTypes['Email']> = ResolversObject<{
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  receiveEmails?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventResolvers<ContextType = any, ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']> = ResolversObject<{
  assignmentIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  assignments?: Resolver<Maybe<Array<Maybe<ResolversTypes['Assignment']>>>, ParentType, ContextType>;
  attachment?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  endDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['EventStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MemberResolvers<ContextType = any, ParentType extends ResolversParentTypes['Member'] = ResolversParentTypes['Member']> = ResolversObject<{
  adminNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  contactInfo?: Resolver<Maybe<ResolversTypes['ContactInfo']>, ParentType, ContextType>;
  deactivationNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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
  imagePath?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  skill?: Resolver<ResolversTypes['Skill'], ParentType, ContextType>;
  skillId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['SkillStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  newUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationNewUserArgs, 'user'>>;
  notification?: Resolver<Maybe<ResolversTypes['Notification']>, ParentType, ContextType, RequireFields<MutationNotificationArgs, 'notification'>>;
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType, RequireFields<MutationOrganizationArgs, 'org'>>;
  rank?: Resolver<Maybe<ResolversTypes['Rank']>, ParentType, ContextType, RequireFields<MutationRankArgs, 'rank'>>;
  removeNotification?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveNotificationArgs, 'id'>>;
  removeRank?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveRankArgs, 'id'>>;
  removeSkill?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveSkillArgs, 'id'>>;
  removeUserSkill?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveUserSkillArgs, 'id'>>;
  removeVenue?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationRemoveVenueArgs, 'id'>>;
  seenNotifications?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationSeenNotificationsArgs, 'notificationIds'>>;
  skill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<MutationSkillArgs, 'skill'>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationUserArgs, 'user'>>;
  userSkill?: Resolver<Maybe<ResolversTypes['MemberSkill']>, ParentType, ContextType, RequireFields<MutationUserSkillArgs, 'userSkill'>>;
  venue?: Resolver<Maybe<ResolversTypes['Venue']>, ParentType, ContextType, RequireFields<MutationVenueArgs, 'venue'>>;
}>;

export type NotificationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Notification'] = ResolversParentTypes['Notification']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  createdById?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  frequency?: Resolver<ResolversTypes['NotificationFrequency'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  memberNotification?: Resolver<Maybe<ResolversTypes['MemberNotification']>, ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rankIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  ranks?: Resolver<Array<Maybe<ResolversTypes['Rank']>>, ParentType, ContextType>;
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
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  weekBegins?: Resolver<ResolversTypes['DayOfWeek'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OrganizationContactResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationContact'] = ResolversParentTypes['OrganizationContact']> = ResolversObject<{
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  phone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PhoneResolvers<ContextType = any, ParentType extends ResolversParentTypes['Phone'] = ResolversParentTypes['Phone']> = ResolversObject<{
  number?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  receiveTexts?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  activeNotifications?: Resolver<Maybe<ResolversTypes['NotificationSearchResult']>, ParentType, ContextType, Partial<QueryActiveNotificationsArgs>>;
  health?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  notification?: Resolver<Maybe<ResolversTypes['Notification']>, ParentType, ContextType, RequireFields<QueryNotificationArgs, 'id'>>;
  notifications?: Resolver<Maybe<ResolversTypes['NotificationSearchResult']>, ParentType, ContextType, Partial<QueryNotificationsArgs>>;
  rank?: Resolver<Maybe<ResolversTypes['Rank']>, ParentType, ContextType, RequireFields<QueryRankArgs, 'id'>>;
  ranks?: Resolver<Maybe<ResolversTypes['RankSearchResult']>, ParentType, ContextType, Partial<QueryRanksArgs>>;
  skill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<QuerySkillArgs, 'id'>>;
  skills?: Resolver<Maybe<ResolversTypes['SkillSearchResult']>, ParentType, ContextType, Partial<QuerySkillsArgs>>;
  users?: Resolver<Maybe<ResolversTypes['UserSearchResult']>, ParentType, ContextType, Partial<QueryUsersArgs>>;
  venue?: Resolver<Maybe<ResolversTypes['Venue']>, ParentType, ContextType, RequireFields<QueryVenueArgs, 'id'>>;
  venues?: Resolver<Maybe<ResolversTypes['VenueSearchResult']>, ParentType, ContextType, Partial<QueryVenuesArgs>>;
}>;

export type RankResolvers<ContextType = any, ParentType extends ResolversParentTypes['Rank'] = ResolversParentTypes['Rank']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  org?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  endTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  event?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  eventId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  locked?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  shiftId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ShiftStatus'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SkillResolvers<ContextType = any, ParentType extends ResolversParentTypes['Skill'] = ResolversParentTypes['Skill']> = ResolversObject<{
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rankOnlyIds?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  ranksOnly?: Resolver<Maybe<Array<Maybe<ResolversTypes['Rank']>>>, ParentType, ContextType>;
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
  cognitoId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  member?: Resolver<ResolversTypes['Member'], ParentType, ContextType>;
  superAdmin?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserAvailabilityResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserAvailability'] = ResolversParentTypes['UserAvailability']> = ResolversObject<{
  dayOfWeek?: Resolver<ResolversTypes['DayOfWeek'], ParentType, ContextType>;
  endTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  unavailable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserSearchResult'] = ResolversParentTypes['UserSearchResult']> = ResolversObject<{
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VenueResolvers<ContextType = any, ParentType extends ResolversParentTypes['Venue'] = ResolversParentTypes['Venue']> = ResolversObject<{
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  city?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  contact?: Resolver<Maybe<ResolversTypes['VenueContact']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  docType?: Resolver<ResolversTypes['DocType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  org?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  phone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['VenueStatus']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  zip?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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
  Assignment?: AssignmentResolvers<ContextType>;
  ContactInfo?: ContactInfoResolvers<ContextType>;
  Email?: EmailResolvers<ContextType>;
  Event?: EventResolvers<ContextType>;
  Member?: MemberResolvers<ContextType>;
  MemberNotification?: MemberNotificationResolvers<ContextType>;
  MemberSkill?: MemberSkillResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Notification?: NotificationResolvers<ContextType>;
  NotificationSearchResult?: NotificationSearchResultResolvers<ContextType>;
  Organization?: OrganizationResolvers<ContextType>;
  OrganizationContact?: OrganizationContactResolvers<ContextType>;
  Phone?: PhoneResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Rank?: RankResolvers<ContextType>;
  RankSearchResult?: RankSearchResultResolvers<ContextType>;
  Shift?: ShiftResolvers<ContextType>;
  Skill?: SkillResolvers<ContextType>;
  SkillSearchResult?: SkillSearchResultResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserAvailability?: UserAvailabilityResolvers<ContextType>;
  UserSearchResult?: UserSearchResultResolvers<ContextType>;
  Venue?: VenueResolvers<ContextType>;
  VenueContact?: VenueContactResolvers<ContextType>;
  VenueSearchResult?: VenueSearchResultResolvers<ContextType>;
}>;

