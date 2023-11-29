import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

import logger from '../utils/logger';
import { EventStatus } from '../__generated__/resolvers-types';
import { createContext } from '../utils/createContext';
import { Action, MailerEvent, MailerEvents } from '../types/mailer';
import { FinalizeOutput } from './finalizeLottery';

const lambda = new LambdaClient({});

const postFCFSShifts = async ({
  orgId,
}: FinalizeOutput) => {
  // Skip if no orgId. This can happen if there are no events to rank :)
  if (!orgId) {
    return;
  }
  const { events } = await createContext();

  await events.collection.updateMany({
    orgId,
    status: EventStatus.ReadyForLottery,
  }, {
    $set: { status: EventStatus.FirstComeFirstServe },
  });

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
