import { ObjectId } from "mongodb";
import middy from "@middy/core";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { PostConfirmationTriggerEvent } from "aws-lambda";
import logger from "../../utils/logger";
import { createContext, IServiceContext } from "../../utils/createContext";
import { MemberRole, MemberStatus, MemberTier } from "../../__generated__/resolvers-types";
import { Action, MailerEvent, MailerEvents } from "../../types/mailer";
import { IUser } from "../../types/common";
import { defaultUserAvailability } from "../../models/user";
import { parseHireDate } from "../../utils/hireDate";
import { phoneNumberParser } from "../../utils/phone";

const lambda = new LambdaClient();

const getCognitoId = (event: PostConfirmationTriggerEvent) => {
  if (event?.request?.userAttributes?.identities?.length > 0) {
    return event.request.userAttributes.sub;
  }
  return event.userName;
}

const getOrgId = async (event: PostConfirmationTriggerEvent, services: IServiceContext) => {
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

    const hireDate = parseHireDate(event.request.userAttributes['custom:employee_date'])
    const primaryPhone = phoneNumberParser(event.request.userAttributes['custom:phony']);

    const userDetails = {
      firstName: event.request.userAttributes.given_name,
      lastName: event.request.userAttributes.family_name,
      name: `${event.request.userAttributes.given_name} ${event.request.userAttributes.family_name}`,
      cognitoId,
      phone: event.request.userAttributes.phone_number || primaryPhone,
      email: event.request.userAttributes.email,
      pNumber: event.request.userAttributes['custom:p_number'] || '',
      role: event.request.userAttributes.role || MemberRole.Member,
      ...(hireDate && { tenor: hireDate }),
    };

    const query: any = {
      cognitoId,
    };

    if (event.request.userAttributes['custom:legacy_sub']) {
      query.cognitoId = {
        $in: [cognitoId, event.request.userAttributes['custom:legacy_sub']]
      };
    }

    let user = await services.users.collection.findOne<IUser>(query);
    if (!user) {
      user = await services.users.collection.findOne<IUser>({
        'member.contactInfo.primaryEmail.address': userDetails.email,
        'member.status': MemberStatus.Invited,
        'member.orgId': new ObjectId(orgId),
      });
      if (!user) {
        const organization = await services.organizations.get(orgId);
        const status = organization?.features.autoEnroll ? MemberStatus.Active : MemberStatus.Pending;
        let tier = MemberTier.Tier_1;
        if (/lasd/i.test(organization?.fromEmail || '')) {
          tier = MemberTier.Tier_3;
        }

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
            tier,
            status,
            tenor: userDetails.tenor,
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
        if (!organization?.features.autoEnroll) {
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
        }
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
