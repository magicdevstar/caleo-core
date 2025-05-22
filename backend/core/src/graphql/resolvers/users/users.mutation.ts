import { GraphQLError } from "graphql";
import { ObjectId } from "mongodb";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { Context } from "../../../utils/createContext";
import {
  NewUser,
  UpdateUser,
  User,
  ProfilePhotoAttachmentUpload,
  MemberTier,
  InputAdminResetPassword,
  MemberRole,
  InviteUser,
  MemberStatus,
} from "../../../__generated__/resolvers-types";
import { adminOnly, adminOrOwnerOnly, userIsAdmin } from "../../../utils/access";
import { Action, MailerEvent, MailerEvents } from "../../../types/mailer";
import { ScheduleEvent, Timezone } from "../../../models/scheduler";
import { format } from "date-fns";
import logger from "../../../utils/logger";
import { IUser } from "../../../types/common";
import { defaultUserAvailability } from "../../../models/user";

const lambda = new LambdaClient();
const cognito = new CognitoIdentityProviderClient({});

export const Mutation = {
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
        pNumber: inputUser.member.pNumber || '',
        tenor: inputUser.member.tenor ? new Date(inputUser.member.tenor) : undefined,
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
        availability: defaultUserAvailability,
        tier: inputUser.member.tier || MemberTier.Tier_1,
        ...(inputUser.member.rankId && { rankId: new ObjectId(inputUser.member.rankId) }),
        ...(inputUser.member.unitId && { unitId: new ObjectId(inputUser.member.unitId) }),
        ...(inputUser.member.divisionId && { divisionId: new ObjectId(inputUser.member.divisionId) }),
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
    member: {
      ...user.member,
      orgId: organization!._id,
      memberSkillIds: (user.member.memberSkillIds || []).map((id) => new ObjectId(id!)),
      availability: defaultUserAvailability,
      ...(user.member.rankId && {rankId: new ObjectId(user.member.rankId!)}),
      ...(user.member.unitId && {unitId: new ObjectId(user.member.unitId!)}),
      ...(user.member.divisionId && {divisionId: new ObjectId(user.member.divisionId!)}),
      ...(user.member.startDate && {startDate: new Date(user.member.startDate)}),
      ...(user.member.tierUntil && {tierUntil: new Date(user.member.tierUntil)}),
      ...(user.member.tenor && {tierUntil: new Date(user.member.tenor)}),
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
    if (user.member?.status && existingUser.member.status !== MemberStatus.Pending) {
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
        ...(user.member?.tenor && { tenor: new Date(user.member?.tenor) }),
        ...(user.member?.rankId && { rankId: new ObjectId(user.member.rankId) }),
        ...(user.member?.unitId && { unitId: new ObjectId(user.member.unitId) }),
        ...(user.member?.divisionId && { divisionId: new ObjectId(user.member.divisionId) }),
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

    if (existingUser.member.status === MemberStatus.Pending) {
      if (updateUser.member.status === MemberStatus.Active) {
        await lambda.send(new InvokeCommand({
          FunctionName: process.env.MAILER_LAMBDA!,
          InvocationType: 'Event',
          Payload: JSON.stringify({
            action: Action.Email,
            template: MailerEvents.OfficerUserAccountApproved,
            data: {
              user: updateUser,
              organization,
            },
          } as MailerEvent),
        }));
      } else if (updateUser.member.status === MemberStatus.Inactive) {
        await lambda.send(new InvokeCommand({
          FunctionName: process.env.MAILER_LAMBDA!,
          InvocationType: 'Event',
          Payload: JSON.stringify({
            action: Action.Email,
            template: MailerEvents.OfficerUserAccountDenial,
            data: {
              user: updateUser,
              organization,
            },
          } as MailerEvent),
        }));
      }
    }

    return res;
  },
  profilePhotoUploadUrl: async (
    _parent: unknown,
    _args: unknown,
    { users, user }: Context
  ): Promise<ProfilePhotoAttachmentUpload> => {
    return users.getUploadUrl({
      orgId: user.member.orgId.toString()!,
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
};
