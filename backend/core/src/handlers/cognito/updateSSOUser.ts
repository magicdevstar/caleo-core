import middy from "@middy/core";
import { injectLambdaContext } from "@aws-lambda-powertools/logger";
import { PostAuthenticationTriggerEvent } from "aws-lambda";
import logger from "../../utils/logger";
import { createContext } from "../../utils/createContext";
import { phoneNumberParser } from "../../utils/phone";

interface IUserAttributes {
  sub: string
  "cognito:user_status": string
  "custom:legacy_sub": string
  "custom:phony": string
  identities?: string
  email_verified: string
  phone_number_verified: string
  phone_number: string
  given_name: string
  family_name: string
  email: string
}

const updateSSOUser = async (event: PostAuthenticationTriggerEvent) => {
  try {
    const services = await createContext();

    const attributes = event.request.userAttributes as unknown as IUserAttributes;
    if (attributes.identities) {
      await services.users.collection.updateOne({
        cognitoId: attributes.sub,
      }, {
        $set: {
          'member.contactInfo.primaryEmail.address': attributes.email,
          'member.contactInfo.primaryPhone.number': phoneNumberParser(attributes['custom:phony']),
          'member.pNumber': attributes['custom:p_number'],
          // TODO: Add hire date once we discover the format
          firstName: attributes.given_name,
          lastName: attributes.family_name,
          name: `${attributes.given_name} ${attributes.family_name}`,
          updatedAt: new Date(),
        }
      });
    }

    if (attributes["custom:legacy_sub"]) {
      const foundUser = await services.users.findByCognitoId(attributes.sub);
      if (!foundUser) {
        await services.users.collection.updateOne({
          cognitoId: attributes["custom:legacy_sub"],
        }, {
          $set: {
            cognitoId: attributes.sub,
            legacyCognitoId: attributes["custom:legacy_sub"],
            updatedAt: new Date(),
          }
        });
      }
    }

    return event;
  } catch(error) {
    logger.error('Failed to update sso user', { error });
    throw error;
  }
};

export const handler = middy(updateSSOUser)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
