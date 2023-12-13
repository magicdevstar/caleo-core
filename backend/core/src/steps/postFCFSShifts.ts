import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

import logger from '../utils/logger';
import { Action, MailerEvent, MailerEvents } from '../types/mailer';
import { FinalizeOutput } from './finalizeLottery';

const lambda = new LambdaClient({});

const postFCFSShifts = async ({
  orgId,
}: FinalizeOutput) => {
  if (!orgId) {
    return;
  }
  await lambda.send(new InvokeCommand({
    FunctionName: process.env.MAILER_LAMBDA,
    InvocationType: 'Event',
    Payload: JSON.stringify({
      action: Action.Email,
      template: MailerEvents.OfficerAvailableOtPosted,
      data: {
        orgId,
      },
    } as MailerEvent),
  }));
};

export const handler = middy(postFCFSShifts)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
