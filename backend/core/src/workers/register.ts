import middy from "@middy/core";
import { injectLambdaContext } from "@aws-lambda-powertools/logger";
import { PreSignUpEmailTriggerEvent } from "aws-lambda";
import logger from "../utils/logger";
import { createContext } from "../utils/createContext";
import { MemberRole, MemberStatus, MemberTier } from "../__generated__/resolvers-types";

const registerUser = async (event: PreSignUpEmailTriggerEvent) => {
  try {
    const services = await createContext();

    const user = await services.users.collection.findOne({
      cognitoId: event.userName,
    });
    if (!user) {
      await services.users.create({
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
