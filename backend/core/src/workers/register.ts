import middy from "@middy/core";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { injectLambdaContext } from "@aws-lambda-powertools/logger";
import { PostConfirmationTriggerEvent } from "aws-lambda";
import logger from "../utils/logger";
import { createContext } from "../utils/createContext";
import { MemberRole, MemberStatus, MemberTier } from "../__generated__/resolvers-types";
import { Action, MailerEvent, MailerEvents } from "../types/mailer";
import { IUser } from "../types/common";
import { ObjectId } from "mongodb";

const lambda = new LambdaClient();

const sso = async (event: PostConfirmationTriggerEvent) => {
  try {
    logger.info('Handling post confirmation event', { event });
    const services = await createContext();

    const {
			request, userName
		} = event;

		const {
			identities,
			sub: cognitoId,
		} = request.userAttributes;


		if (!identities) {
			const msg = 'Exiting Function: normal sign up detected due to missing identities userAttribute';
			logger.info(msg);
      return event;
		}

    const { providerName } = JSON.parse(identities)[0];

    if (!providerName) {
			const msg = 'Error: Missing providerName';
			logger.error(msg, { event });
			throw msg;
		}

    const foundOrganization = await services.organizations.getBySSOAppName(providerName);

    if (!foundOrganization) {
      const msg = 'Error: Organization misconfigured';
			logger.error(msg, { event });
			throw msg;
    }
    // TODO: Add org id to cognito user before moving on

    const foundUser = await services.users.findByCognitoId(cognitoId);
    if (foundUser) {
      if (foundUser.member.orgId.toString() != foundOrganization._id?.toString()) {
        const msg = 'Error: User already exists with different org';
        logger.error(msg, { event });
        throw msg;
      }
      return event;
    }

    await services.users.create({
      firstName: event.request.userAttributes.given_name,
      lastName: event.request.userAttributes.family_name,
      name: `${event.request.userAttributes.given_name} ${event.request.userAttributes.family_name}`,
      cognitoId,
      superAdmin: false,
      member: {
        orgId: foundOrganization._id!,
        // TODO: Set a standard field form SAML Provider
        pNumber: 'random-p-number',
        role: MemberRole.Member,
        tier: MemberTier.Tier_1,
        status: MemberStatus.Active,
        // TODO: Default rank for user (Maybe unassigned or something?)
        rankId: new ObjectId('64d245c578e93d7dd3ae8b53'),
        memberSkillIds: [],
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

    return event;
  } catch(error) {
    logger.error('Error handling pre-signup event', {error});
    throw error;
  }
}

const registerUser = async (event: PostConfirmationTriggerEvent) => {
  try {
    const services = await createContext();

    let user = await services.users.collection.findOne<IUser>({
      cognitoId: event.userName,
    });
    if (!user) {
      if (event?.request?.userAttributes?.identities?.length > 0) {
        return sso(event);
      }
      user = await services.users.collection.findOne<IUser>({
        'member.contactInfo.primaryEmail.address': event.request.userAttributes.email,
        'member.status': MemberStatus.Invited,
        'member.orgId': new ObjectId(event.request.userAttributes['custom:org_id']),
      });
      if (!user) {
        const createdUser = await services.users.create({
          firstName: event.request.userAttributes.given_name,
          lastName: event.request.userAttributes.family_name,
          name: `${event.request.userAttributes.given_name} ${event.request.userAttributes.family_name}`,
          cognitoId: event.userName,
          superAdmin: false,
          member: {
            orgId: new ObjectId(event.request.userAttributes['custom:org_id']),
            pNumber: event.request.userAttributes['custom:p_number'],
            role: event.request.userAttributes.role || MemberRole.Member,
            tier: MemberTier.Tier_1,
            status: MemberStatus.Pending,
            memberSkillIds: [],
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
          id: user._id!.toString(),
          firstName: event.request.userAttributes.given_name,
          lastName: event.request.userAttributes.family_name,
          name: `${event.request.userAttributes.given_name} ${event.request.userAttributes.family_name}`,
          cognitoId: event.userName,
          superAdmin: false,
          member: {
            orgId: new ObjectId(event.request.userAttributes['custom:org_id']),
            pNumber: event.request.userAttributes['custom:p_number'],
            role: user.member.role || MemberRole.Member,
            tier: user.member.tier || MemberTier.Tier_1,
            rankId: user.member.rankId,
            status: MemberStatus.Active,
            memberSkillIds: [],
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
