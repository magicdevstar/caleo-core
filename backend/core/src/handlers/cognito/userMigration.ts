import middy from "@middy/core";
import { jwtDecode } from "jwt-decode";
import { injectLambdaContext } from "@aws-lambda-powertools/logger";
import { UserMigrationTriggerHandler } from "aws-lambda";
import logger from "../../utils/logger";
import { 
  AuthFlowType, 
  CognitoIdentityProviderClient, 
  ListUsersCommand,
  AdminInitiateAuthCommand
} from "@aws-sdk/client-cognito-identity-provider";

const cognito = new CognitoIdentityProviderClient({});

const userMigration: UserMigrationTriggerHandler = async (event) => {
  try {
    if (event.triggerSource === 'UserMigration_Authentication') {
      const res = await cognito.send(new AdminInitiateAuthCommand({
        AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
        UserPoolId: process.env.LEGACY_POOL_ID!,
        ClientId: process.env.LEGACY_CLIENT_ID!,
        AuthParameters: {
          USERNAME: event.userName,
          PASSWORD: event.request.password
        }
      }));
  
      if (res.AuthenticationResult && res.AuthenticationResult.IdToken) {
        const decoded = jwtDecode<{
          sub: string;
          phone_number: string;
          family_name: string;
          given_name: string;
          email: string;
        }>(res.AuthenticationResult.IdToken);
  
        event.response.userAttributes = {
          phone_number: decoded.phone_number,
          family_name: decoded.family_name,
          given_name: decoded.given_name,
          email: decoded.email.toLowerCase(),
          // Saving this here so we can reconnect the users in our system in post authentication
          'custom:legacy_sub': decoded.sub,
          email_verified: "true",
          phone_number_verified: "true"
        };
  
        event.response.finalUserStatus = "CONFIRMED";
        event.response.messageAction = "SUPPRESS";
        return event;
      }
    } else if (event.triggerSource === 'UserMigration_ForgotPassword') {
      const users = await cognito.send(new ListUsersCommand({
        UserPoolId: process.env.LEGACY_POOL_ID!,
        Filter: `email = "${event.userName}"`,
      }));
      if (users.Users && users.Users.length > 0) {
        const user = users.Users[0];
        event.response.userAttributes = {
          phone_number: user.Attributes?.find(a => a.Name === 'phone_number')?.Value || '',
          family_name: user.Attributes?.find(a => a.Name === 'family_name')?.Value || '',
          given_name: user.Attributes?.find(a => a.Name === 'given_name')?.Value || '',
          email: user.Attributes?.find(a => a.Name === 'email')?.Value || '',
          // Saving this here so we can reconnect the users in our system in post authentication
          'custom:legacy_sub': user.Attributes?.find(a => a.Name === 'sub')?.Value || '',
          email_verified: "true",
          phone_number_verified: "true"
        }
        event.response.messageAction = "SUPPRESS";
        return event;
      }
    }

    return event;
  } catch(error) {
    if (['NotAuthorizedException'].includes(error.name)) {
      logger.error('Failed to migrate user', { event });
      throw error;
    }
    logger.error('Failed to migrate user', { error, event });
    throw new Error('Something went wrong please try again.');
  }
}

export const handler = middy(userMigration)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
