import middy from '@middy/core';
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { injectLambdaContext } from '@aws-lambda-powertools/logger';

import logger from '../../../utils/logger';
import { createContext } from '../../../utils/createContext';
import { MemberStatus } from '../../../__generated__/resolvers-types';
import { Action, MailerEvent, MailerEvents } from '../../../types/mailer';
import { IOrganization } from '../../../models/organization';

const lambda = new LambdaClient();

let organizationMap: Record<string, IOrganization> = {};
const memberStatusSync = async () => {
  const { users, organizations } = await createContext();

  logger.setLogLevel('INFO');
  const query = {
    'member.status': MemberStatus.Inactive,
    'member.inactivateUntil': { $lte: new Date() }
  };

  const foundUsers = await users.collection.find(query).toArray();
  if (foundUsers.length === 0) {
    return;
  }

  const res = await users.collection.updateMany(query, {
    $set: {
      'member.status': MemberStatus.Active,
    },
    $unset: {
      'member.inactivateUntil': '',
    }
  });

  for (const user of foundUsers) {
    let organization = organizationMap[user.member.orgId];
    if (!organization) {
      const foundOrg = await organizations.get(user.member.orgId);
      organizationMap[user.member.orgId] = foundOrg!;
      organization = foundOrg!;
    }
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA!,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template: MailerEvents.OfficerUserAccountReactivated,
        data: {
          user: {
            id: user._id.toString(),
            ...user,
          },
          organization,
        },
      } as MailerEvent),
    }));
  }

  logger.info('Status reset results', { res });
};

export const handler = middy(memberStatusSync)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
