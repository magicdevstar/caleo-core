import middy from "@middy/core";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { injectLambdaContext } from "@aws-lambda-powertools/logger";
import { PostConfirmationTriggerEvent } from "aws-lambda";
import logger from "../utils/logger";
import { Context, createContext } from "../utils/createContext";
import { MemberRole, MemberStatus, MemberTier } from "../__generated__/resolvers-types";
import { Action, MailerEvent, MailerEvents } from "../types/mailer";
import { IUser } from "../types/common";
import { ObjectId } from "mongodb";
import { defaultUserAvailability } from "../models/user";

const lambda = new LambdaClient();

const getCognitoId = (event: PostConfirmationTriggerEvent) => {
  if (event?.request?.userAttributes?.identities?.length > 0) {
    return event.request.userAttributes.sub;
  }
  return event.userName;
}

const getOrgId = async (event: PostConfirmationTriggerEvent, services: Context) => {
  if (event?.request?.userAttributes?.identities?.length > 0) {
    const { providerName } = JSON.parse(event.request.userAttributes.identities)[0];
    const foundOrganization = await services.organizations.getBySSOAppName(providerName);
    if (!foundOrganization) {
      const msg = 'Error: Organization misconfigured';
      logger.error(msg, { event });
      throw msg;
    }
    return foundOrganization._id!.toString();
  }
  return event.request.userAttributes['custom:org_id'];
}

const registerUser = async (event: PostConfirmationTriggerEvent) => {
  try {
    const services = await createContext();

    const cognitoId = getCognitoId(event);
    const orgId = await getOrgId(event, services);

    const userDetails = {
      firstName: event.request.userAttributes.given_name,
      lastName: event.request.userAttributes.family_name,
      name: `${event.request.userAttributes.given_name} ${event.request.userAttributes.family_name}`,
      cognitoId,
      phone: event.request.userAttributes.phone_number,
      email: event.request.userAttributes.email,
      pNumber: event.request.userAttributes['custom:p_number'] || '',
      role: event.request.userAttributes.role || MemberRole.Member
    }

    let user = await services.users.collection.findOne<IUser>({
      cognitoId,
    });
    if (!user) {
      user = await services.users.collection.findOne<IUser>({
        'member.contactInfo.primaryEmail.address': userDetails.email,
        'member.status': MemberStatus.Invited,
        'member.orgId': new ObjectId(orgId),
      });
      if (!user) {
        const createdUser = await services.users.create({
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          name: userDetails.name,
          cognitoId,
          superAdmin: false,
          member: {
            orgId: new ObjectId(orgId),
            pNumber: userDetails.pNumber,
            role: userDetails.role,
            tier: MemberTier.Tier_1,
            status: MemberStatus.Pending,
            memberSkillIds: [],
            contactInfo: {
              primaryPhone: {
                number: userDetails.phone,
                receiveTexts: true,
              },
              primaryEmail: {
                address: userDetails.email,
                receiveEmails: true,
              },
            },
            availability: defaultUserAvailability,
          }
        } as any);
        await lambda.send(new InvokeCommand({
          FunctionName: process.env.MAILER_LAMBDA!,
          InvocationType: 'Event',
          Payload: JSON.stringify({
            action: Action.Email,
            template: MailerEvents.AdminUserAccountRequested,
            data: {
              user: createdUser,
              orgId,
            },
          } as MailerEvent),
        }));
      } else {
        user = {
          ...user,
          id: user._id!.toString(),
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          name: userDetails.name,
          cognitoId,
          superAdmin: false,
          member: {
            orgId: new ObjectId(orgId),
            pNumber: userDetails.pNumber || user.member.pNumber,
            role: user.member.role || MemberRole.Member,
            tier: user.member.tier || MemberTier.Tier_1,
            tenor: user.member.tenor,
            rankId: user.member.rankId,
            status: MemberStatus.Active,
            memberSkillIds: [],
            contactInfo: {
              primaryPhone: {
                number: userDetails.phone,
                receiveTexts: true,
              },
              primaryEmail: {
                address: userDetails.email,
                receiveEmails: true,
              },
            },
            availability: defaultUserAvailability,
          }
        } as any;
        await services.users.update(user as any);
      }
    }

    if (user && user.removedAt) {
      delete user.removedAt;
      user.id = user._id!.toString();
      await services.users.update(user as any);
    }

    return event;
  } catch(error) {
    logger.error('Failed to register user', { error });
    throw error;
  }
};

export const handler = middy(registerUser)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
