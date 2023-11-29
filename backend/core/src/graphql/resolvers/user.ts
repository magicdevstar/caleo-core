import { GraphQLError } from "graphql";
import { ObjectId } from "mongodb";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { Context } from "../../utils/createContext";
import {
  Member,
  NewUser,
  UserSearchInput,
  UpdateUser,
  User,
  ProfilePhotoAttachmentUpload,
  MemberTier,
  InputAdminResetPassword,
  MemberRole,
  InviteUser,
  MemberStatus,
} from "../../__generated__/resolvers-types";
import { adminOnly, adminOrOwnerOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { Action, MailerEvent, MailerEvents } from "../../types/mailer";
import { ScheduleEvent } from "../../models/scheduler";
import { format } from "date-fns";

const lambda = new LambdaClient();

export const user = {
  Query: {
    me: async (
      _parent: unknown,
      _args: unknown,
      { users, user }: Context
    ): Promise<User | null> => users.get(user!.id),
    user: async (
      _parent: unknown,
      { id }: { id: string },
      { users, user }: Context
    ): Promise<User | null> => {
      adminOrOwnerOnly(id, user);
      return users.get(id);
    },
    users: async (
      _parent: unknown,
      { input }: { input: UserSearchInput },
      { users, user }: Context
    ): Promise<SearchResults<User>> => users.search({
      limit: input.limit,
      skip: input.skip,
      queryField: input.queryField || 'name',
      order: input.order,
      orderBy: input.orderBy,
      query: input.query,
      ...(input.excludeIds && { _id: { $nin: input.excludeIds.map((id: any) => new ObjectId(id)) } }),
      ...(input.pNumber ? {'member.pNumber': {
        $regex: input.pNumber,
        $options: 'i',
      }} : {}),
      ...(input.phone ? {'member.contactInfo.primaryPhone.number': {
        $regex: input.phone,
        $options: 'i',
      }} : {}),
      ...(input.email ? {'member.contactInfo.primaryEmail.address': {
        $regex: input.email,
        $options: 'i',
      }} : {}),
      ...(input.rankIds ? {'member.rankId': { $in: input.rankIds }} : {}),
      ...(input.statuses ? {'member.status': { $in: input.statuses }} : {}),
      ...(input.tiers ? {'member.tier': { $in: input.tiers }} : {}),
      ...('admin' in input ? {'member.role': input.admin ? MemberRole.Admin : MemberRole.Member} : {}),
      'member.orgId': user?.member.orgId!,
    }),
  },
  Mutation: {
    inviteUser: async (
      _parent: unknown,
      { user: inputUser }: { user: InviteUser },
      { users, user, organization }: Context
    ): Promise<User> => {
      const createdUser = await users.create({
        cognitoId: '',
        firstName: '',
        lastName: '',
        name: '',
        superAdmin: false,
        member: {
          orgId: user?.member.orgId!,
          pNumber: '',
          role: inputUser.member.role || MemberRole.Member,
          status: MemberStatus.Invited,
          contactInfo: {
            primaryPhone: {
              number: '',
              receiveTexts: true,
            },
            primaryEmail: {
              address: inputUser.email,
              receiveEmails: true,
            },
          },
          tier: inputUser.member.tier || MemberTier.Tier_1,
          rankId: inputUser.member.rankId,
          maxShifts: organization?.settings?.shiftsPerWeek,
        },
      } as any);

      await lambda.send(new InvokeCommand({
        FunctionName: process.env.MAILER_LAMBDA!,
        InvocationType: 'Event',
        Payload: JSON.stringify({
          action: Action.Email,
          template: MailerEvents.OfficerUserAccountInvitation,
          data: {
            inviteEmail: inputUser.email,
            user,
            organization,
          }
        } as MailerEvent),
      }));

      return createdUser;
    },
    newUser: async (
      _parent: unknown,
      { user }: { user: NewUser },
      { users }: Context
    ): Promise<User> => users.create({
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      availability: {
        monday: {
          available: false,
          times: [],
        },
        tuesday: {
          available: false,
          times: [],
        },
        wednesday: {
          available: false,
          times: [],
        },
        thursday: {
          available: false,
          times: [],
        },
        friday: {
          available: false,
          times: [],
        },
        saturday: {
          available: false,
          times: [],
        },
        sunday: {
          available: false,
          times: [],
        },
      },
    } as any),
    user: async (
      _parent: unknown,
      { user }: { user: UpdateUser },
      {
        organization,
        users,
        user: reqUser,
        scheduler,
      }: Context
    ): Promise<User> => {
      const existingUser = await users.get(user.id);

      if (!existingUser) {
        throw new GraphQLError('User not found');
      }

      let tierUpdates: any = {};
      let tierSchedule: Promise<any> = Promise.resolve();
      if (user.member?.tier) {
        if (user.member.tier === MemberTier.Tier_2 && user.member.tierUntil) {
          const tierReturnDate = new Date(user.member.tierUntil);
          tierUpdates = { tierUntil: tierReturnDate.getTime() };
          tierSchedule = scheduler.updateScheduledEvent({
            event: ScheduleEvent.USER_TIER_RETURN,
            orgId: organization!.id,
            eventTime: `at(${format(tierReturnDate, 'yyyy-MM-dd&&hh:mm:ss').replace('&&','T')})`,
            eventTimeZone: organization?.timezone || 'America/Los_Angeles' as any,
            customEventName: `${ScheduleEvent.USER_TIER_RETURN}-${user.id}`,
            eventInput: JSON.stringify({
              action: ScheduleEvent.USER_TIER_RETURN,
              orgId: organization!.id,
              userId: user.id,
              tier: MemberTier.Tier_1,
            }),
          });
        } else {
          tierUpdates = {
            tierUntil: null,
            tierResetOnNextLottery: false,
          };
        }
      }

      const updateUser = {
        ...existingUser,
        ...user,
        name: `${user.firstName} ${user.lastName}`,
        member: {
          ...existingUser.member,
          ...user.member,
          ...tierUpdates,
          contactInfo: user.member?.contactInfo || existingUser.member?.contactInfo,
          memberSkillIds: user.member?.memberSkillIds || existingUser.member?.memberSkillIds,
          availability: user.member?.availability || existingUser.member?.availability,
        },
        modifiedById: reqUser!.id,
      };

      const res = await users.update(updateUser as any, { skipMerge: true });
      await tierSchedule;
      return res;
    },
    profilePhotoUploadUrl: async (
      _parent: unknown,
      _args: unknown,
      { users, user }: Context
    ): Promise<ProfilePhotoAttachmentUpload> => {
      return users.getUploadUrl({
        orgId: user?.member.orgId!,
      });
    },
    removeUser: async (
      _parent: unknown,
      { id }: { id: string },
      { users, user }: Context
    ): Promise<string> => {
      adminOnly(user);
      await users.remove(id, {
        modifiedById: user!.id,
      });
      return id;
    },
    adminEditPassword: async (
      _parent: unknown,
      { input }: { input: InputAdminResetPassword },
      { users, user }: Context
    ): Promise<boolean> => {
      adminOnly(user);
      return users.resetPassword(input);
    },
  },
  fields: {
    User: {
      ...commonResolvers,
      image: (user: User, _, { users }: Context) => user.imagePath ? users.getDownloadUrl(user.imagePath!) : null,
    },
    Member: {
      rank: (member: Member, _, { ranks }: Context) =>
        member.rankId ? ranks.loader.load(member.rankId) : null,
      memberSkills: (member: Member, _, { memberSkills }: Context) => {
        if (Array.isArray(member.memberSkillIds) && member.memberSkillIds.length > 0) {
          return memberSkills.loader.loadMany(member.memberSkillIds as string[]);
        }
        return [];
      },
      tierUntil: (member: Member) => member.tierUntil ? new Date(member.tierUntil).toISOString() : null,
      org: (member: Member, _, { organizations }: Context) => organizations.loader.load(member.orgId),
    },
  },
};
