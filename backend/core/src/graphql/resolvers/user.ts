import { GraphQLError } from "graphql";
import { ObjectId } from "mongodb";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand
} from "@aws-sdk/client-cognito-identity-provider";
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
  AllUsersSearchInput,
} from "../../__generated__/resolvers-types";
import { adminOnly, adminOrOwnerOnly, superAdminOnly, userIsAdmin } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { Action, MailerEvent, MailerEvents } from "../../types/mailer";
import { ScheduleEvent, Timezone } from "../../models/scheduler";
import { addHours, endOfWeek, format, startOfWeek } from "date-fns";
import logger from "../../utils/logger";
import { IMember, IUser } from "../../types/common";

const lambda = new LambdaClient();
const cognito = new CognitoIdentityProviderClient({});

interface EnhancedUser extends IUser {
  shiftStart?: string;
  timezoneOffset?: number;
}

export const user = {
  Query: {
    me: async (
      _parent: unknown,
      _args: unknown,
      { users, user }: Context
    ): Promise<IUser | null> => users.get(user!._id!),
    user: async (
      _parent: unknown,
      { id, shiftStart, timezoneOffset }: { id: string; shiftStart: string; timezoneOffset: number; },
      { users, user }: Context
    ): Promise<EnhancedUser | null> => {
      adminOrOwnerOnly(id, user);
      const usr = await users.get(id);

      return {
        ...(usr!),
        shiftStart,
        timezoneOffset,
      };
    },
    users: async (
      _parent: unknown,
      { input }: { input: UserSearchInput },
      { users, user }: Context
    ): Promise<SearchResults<IUser>> => users.search({
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
      ...(input.rankIds ? {'member.rankId': { $in: input.rankIds.map((r) => new ObjectId(r!)) }} : {}),
      ...(input.statuses ? {'member.status': { $in: input.statuses }} : {}),
      ...(input.tiers ? {'member.tier': { $in: input.tiers }} : {}),
      ...('admin' in input ? {'member.role': input.admin ? MemberRole.Admin : MemberRole.Member} : {}),
      'member.orgId': user?.member.orgId!,
    }),
    allUsers: async (
      _parent: unknown,
      { input }: { input: AllUsersSearchInput },
      { users, user }: Context
    ): Promise<SearchResults<IUser>> => {
      superAdminOnly(user);

      return users.search({
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
        ...(input.rankIds ? {'member.rankId': { $in: input.rankIds.map((r) => new ObjectId(r!)) }} : {}),
        ...(input.statuses ? {'member.status': { $in: input.statuses }} : {}),
        ...(input.tiers ? {'member.tier': { $in: input.tiers }} : {}),
        ...('admin' in input ? {'member.role': input.admin ? MemberRole.Admin : MemberRole.Member} : {}),
        ...(input.orgIds ? {'member.orgId': { $in: input.orgIds.map((o) => new ObjectId(o!)) }} : {}),
      });
    }
  },
  Mutation: {
    resetImpersonation: async (
      _parent: unknown,
      _input: unknown,
      { users, user, originalUser }: Context
    ) => {
      const res = await users.resetImpersonation(originalUser || user!);
      return res;
    },
    impersonateUser: async (
      _parent: unknown,
      { userId }: { userId: string },
      { users, user }: Context
    ) => {
      const res = await users.impersonateUser(user!, userId);
      return res;
    },
    inviteUser: async (
      _parent: unknown,
      { user: inputUser }: { user: InviteUser },
      { users, user, organization, organizations }: Context
    ): Promise<IUser> => {
      if (user?.superAdmin && inputUser.orgId) {
        const foundOrganization = await organizations.get(inputUser.orgId);
        if (foundOrganization) {
          organization = foundOrganization;
        }
      }

      const createdUser = await users.create({
        cognitoId: '',
        firstName: '',
        lastName: '',
        name: '',
        superAdmin: false,
        member: {
          orgId: organization!._id,
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
          tier: inputUser.member.tier || MemberTier.Tier_1,
          ...(inputUser.member.rankId && { rankId: new ObjectId(inputUser.member.rankId) }),
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
      { users, organization }: Context
    ): Promise<IUser> => users.create({
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
      member: {
        ...user.member,
        orgId: organization!._id,
        memberSkillIds: (user.member.memberSkillIds || []).map((id) => new ObjectId(id!)),
        ...(user.member.rankId && {rankId: new ObjectId(user.member.rankId!)}),
        ...(user.member.startDate && {startDate: new Date(user.member.startDate)}),
        ...(user.member.tierUntil && {tierUntil: new Date(user.member.tierUntil)}),
        ...(user.member.inactivateUntil && {tierUntil: new Date(user.member.inactivateUntil)}),
      }
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
      adminOrOwnerOnly(user.id, reqUser);

      if (!userIsAdmin(reqUser) && user?.member?.startDate) {
        delete user?.member?.startDate;
      }

      const existingUser = await users.get(user.id);

      if (!existingUser) {
        throw new GraphQLError('User not found');
      }

      // If we are updating the users status
      let inactivateSchedule: Promise<any> = Promise.resolve();
      if (user.member?.status) {
        if (user.member.status === MemberStatus.Inactive) {
          if (user.member?.inactivateUntil) {
            const inactivateUntil = new Date(user.member?.inactivateUntil);
            user.member.inactivateUntil = inactivateUntil as any;
            inactivateSchedule = scheduler.updateScheduledEvent({
              event: ScheduleEvent.USER_INACTIVE_RETURN,
              orgId: organization!._id!,
              eventTime: `at(${format(inactivateUntil, 'yyyy-MM-dd&&HH:mm:ss').replace('&&','T')})`,
              eventTimeZone: Timezone.UTC,
              customEventName: `${ScheduleEvent.USER_INACTIVE_RETURN}-${user.id}`,
              eventInput: JSON.stringify({
                action: ScheduleEvent.USER_INACTIVE_RETURN,
                orgId: organization!.id,
                userId: user.id,
                status: MemberStatus.Active,
              }),
            });
          }
          // Prevent sending multiple deactivation notices 😈
          if (existingUser.member.status !== user.member.status) {
            await lambda.send(new InvokeCommand({
              FunctionName: process.env.MAILER_LAMBDA!,
              InvocationType: 'Event',
              Payload: JSON.stringify({
                action: Action.Email,
                template: MailerEvents.OfficerUserAccountDeactivated,
                data: {
                  user: existingUser,
                  organization,
                  inactivateUntil: user.member?.inactivateUntil,
                  inactivationNote: user.member?.inactivationNote,
                },
              } as MailerEvent),
            }));
          }
        } else if (existingUser.member.status === MemberStatus.Inactive) {
          user.member.inactivateUntil = null;
          user.member.inactivationNote = null;
          await scheduler.removeSchedule({
            event: ScheduleEvent.USER_INACTIVE_RETURN,
            orgId: organization!._id,
            customEventName: `${ScheduleEvent.USER_INACTIVE_RETURN}-${user.id}`,
            ignoreError: true,
          });
          await lambda.send(new InvokeCommand({
            FunctionName: process.env.MAILER_LAMBDA!,
            InvocationType: 'Event',
            Payload: JSON.stringify({
              action: Action.Email,
              template: MailerEvents.OfficerUserAccountReactivated,
              data: {
                user: existingUser,
                organization,
              },
            } as MailerEvent),
          }));
        }
      }

      let tierUpdates: any = {};
      if (user.member?.tier) {
        if (user.member.tierUntil) {
          const targetTier = user.member.tier === MemberTier.Tier_2 ? MemberTier.Tier_1 : MemberTier.Tier_2;
          const tierReturnDate = new Date(user.member.tierUntil);
          tierUpdates = {
            tierUntil: tierReturnDate,
            tierResetOnNextLottery: false,
          };
        } else {
          tierUpdates = {
            tierUntil: null,
            tierResetOnNextLottery: !user.member.tierUntil ? existingUser.member.tierResetOnNextLottery : false,
          };
        }
      }

      if (
        user.member?.contactInfo?.primaryEmail?.address &&
        user.member?.contactInfo?.primaryEmail?.address !== existingUser.member.contactInfo?.primaryEmail.address
      ) {
        try {
          await cognito.send(new AdminUpdateUserAttributesCommand({
            UserPoolId: process.env.COGNITO_POOL_ID!,
            Username: existingUser.cognitoId!,
            UserAttributes: [
              {
                Name: 'email',
                Value: user.member.contactInfo.primaryEmail.address,
              },
              {
                Name: 'email_verified',
                Value: 'true',
              },
            ],
          }));
        } catch(error) {
          logger.error('Error updating email in cognito', { error });
        }
      }

      const updateUser: IUser = {
        ...existingUser,
        ...user,
        name: `${user.firstName} ${user.lastName}`,
        member: {
          ...existingUser.member,
          ...user.member,
          ...tierUpdates,
          ...(user.member?.rankId && { rankId: new ObjectId(user.member.rankId) }),
          ...(user.member?.startDate && { startDate: new Date(user.member.startDate) }),
          orgId: new ObjectId(existingUser.member.orgId),
          contactInfo: user.member?.contactInfo || existingUser.member?.contactInfo,
          memberSkillIds: (user.member?.memberSkillIds || existingUser.member?.memberSkillIds || []).map((skillId) => new ObjectId(skillId)),
          availability: user.member?.availability || existingUser.member?.availability,
        },
        modifiedById: reqUser!._id!,
      };

      const res = await users.update(updateUser as any);
      await inactivateSchedule;
      return res;
    },
    profilePhotoUploadUrl: async (
      _parent: unknown,
      _args: unknown,
      { users, user }: Context
    ): Promise<ProfilePhotoAttachmentUpload> => {
      return users.getUploadUrl({
        orgId: user?.member.orgId.toString()!,
      });
    },
    removeUser: async (
      _parent: unknown,
      { id }: { id: string },
      { users, user }: Context
    ): Promise<string> => {
      adminOnly(user);
      await users.remove(id, {
        modifiedById: user!._id!,
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
      image: (user: IUser, _, { users }: Context) => user.imagePath ? users.getDownloadUrl(user.imagePath!) : null,
      shiftsThisWeek: (parent: EnhancedUser, _: any, { shifts }: Context) => {
        logger.info('Shifts this week', { parent });
        if (!parent.shiftStart || !parent.timezoneOffset) {
          return null;
        }
        const beginningOfWeek = addHours(startOfWeek(new Date(parent.shiftStart), { weekStartsOn: 1 }), parent.timezoneOffset || 0);
        const endOfTheWeek = addHours(endOfWeek(new Date(parent.shiftStart), { weekStartsOn: 1 }), parent.timezoneOffset || 0);
        return shifts.weekShiftsLoader.load({
          id: parent._id?.toString()!,
          orgId: parent.member.orgId.toString(),
          beginningOfWeek,
          endOfWeek: endOfTheWeek,
        });
      },
      numberOfHoursThisMonth: (parent: EnhancedUser, _args: any, { shifts }: Context) => {
        if (!parent.shiftStart || !parent.timezoneOffset) {
          return null;
        }
        const beginningOfMonth = addHours(startOfWeek(new Date(parent.shiftStart), { weekStartsOn: 1 }), parent.timezoneOffset || 0);
        const endOfTheMonth = addHours(endOfWeek(new Date(parent.shiftStart), { weekStartsOn: 1 }), parent.timezoneOffset || 0);
        return shifts.shiftHoursLoader.load({
          id: parent._id?.toString()!,
          orgId: parent.member.orgId.toString(),
          beginningOfMonth,
          endOfMonth: endOfTheMonth,
        });
      },
      numberOfShiftsThisWeek: (parent: EnhancedUser, _args: any, { shifts }: Context) => {
        if (!parent.shiftStart || !parent.timezoneOffset) {
          return null;
        }
        const beginningOfWeek = addHours(startOfWeek(new Date(parent.shiftStart), { weekStartsOn: 1 }), parent.timezoneOffset || 0);
        const endOfTheWeek = addHours(endOfWeek(new Date(parent.shiftStart), { weekStartsOn: 1 }), parent.timezoneOffset || 0);
        return shifts.shiftCountLoader.load({
          id: parent._id?.toString()!,
          orgId: parent.member.orgId.toString(),
          beginningOfWeek,
          endOfWeek: endOfTheWeek,
        });
      },
      browserNotificationSettings: (user: IUser, _, { browserNotificationSubscriptions }: Context) => browserNotificationSubscriptions.userIdLoader.load(user._id!),
    },
    Member: {
      startDate: (member: IMember) => member.startDate ? new Date(member.startDate).toISOString() : null,
      rank: async (member: IMember, _, { ranks }: Context) => {
        const result = await (member.rankId ? ranks.loader.load(member.rankId.toString()) : null);
        logger.info('Member rank', { member, result, rankId: member?.rankId?.toString() });
        return result;
      },
      memberSkills: (member: IMember, _, { memberSkills }: Context) => {
        if (Array.isArray(member.memberSkillIds) && member.memberSkillIds.length > 0) {
          return memberSkills.loader.loadMany(member.memberSkillIds.map((id) => id?.toString()) as string[]);
        }
        return [];
      },
      tierUntil: (member: IMember) => member.tierUntil ? new Date(member.tierUntil).toISOString() : null,
      inactivateUntil: (member: IMember) => member.inactivateUntil ? new Date(member.inactivateUntil).toISOString() : null,
      org: async (member: IMember, _, { organizations }: Context) => {
        const result = await organizations.loader.load(member.orgId.toString());
        logger.info('Member org', { member, result, orgId: member.orgId.toString() });
        return result;
      },
    },
  },
};
