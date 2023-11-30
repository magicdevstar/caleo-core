import middy from "@middy/core";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { injectLambdaContext } from "@aws-lambda-powertools/logger";
import { PreSignUpEmailTriggerEvent } from "aws-lambda";
import logger from "../utils/logger";
import { createContext } from "../utils/createContext";
import { MemberRole, MemberStatus, MemberTier } from "../__generated__/resolvers-types";
import { Action, MailerEvent, MailerEvents } from "../types/mailer";

const lambda = new LambdaClient();

const registerUser = async (event: PreSignUpEmailTriggerEvent) => {
  try {
    const services = await createContext();

    let user = await services.users.collection.findOne({
      cognitoId: event.userName,
    });
    if (!user) {
      user = await services.users.collection.findOne({
        'member.contactInfo.primaryEmail.address': event.request.userAttributes.email,
        'member.status': MemberStatus.Invited,
      });
      if (!user) {
        const createdUser = await services.users.create({
          firstName: event.request.userAttributes.given_name,
          lastName: event.request.userAttributes.family_name,
          name: `${event.request.userAttributes.given_name} ${event.request.userAttributes.family_name}`,
          cognitoId: event.userName,
          superAdmin: false,
          member: {
            orgId: event.request.userAttributes['custom:org_id'],
            pNumber: event.request.userAttributes['custom:p_number'],
            role: event.request.userAttributes.role || MemberRole.Member,
            tier: MemberTier.Tier_1,
            status: MemberStatus.Pending,
            contactInfo: {
              primaryPhone: {
                number: event.request.userAttributes.phone_number,
                receiveTexts: true,
              },
              primaryEmail: {
                address: event.request.userAttributes.email,
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
              orgId: event.request.userAttributes['custom:org_id'],
            },
          } as MailerEvent),
        }));
      } else {
        user = {
          ...user,
          id: user._id.toString(),
          firstName: event.request.userAttributes.given_name,
          lastName: event.request.userAttributes.family_name,
          name: `${event.request.userAttributes.given_name} ${event.request.userAttributes.family_name}`,
          cognitoId: event.userName,
          superAdmin: false,
          member: {
            orgId: event.request.userAttributes['custom:org_id'],
            pNumber: event.request.userAttributes['custom:p_number'],
            role: event.request.userAttributes.role || MemberRole.Member,
            tier: user.member.tier || MemberTier.Tier_1,
            rankId: user.member.rankId,
            status: MemberStatus.Active,
            contactInfo: {
              primaryPhone: {
                number: event.request.userAttributes.phone_number,
                receiveTexts: true,
              },
              primaryEmail: {
                address: event.request.userAttributes.email,
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
          }
        } as any;
        await services.users.update(user as any, { skipMerge: true });
      }
    }

    if (user && user.removedAt) {
      delete user.removedAt;
      user.id = user._id.toString();
      await services.users.update(user as any, { skipMerge: true });
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
