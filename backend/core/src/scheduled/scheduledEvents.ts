import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

import logger from '../utils/logger';
import { ScheduleEvent } from '../models/scheduler';
import { createContext } from '../utils/createContext';
import { MemberTier } from '../__generated__/resolvers-types';

const client = new SFNClient({});

interface ParsedEvent {
  action: ScheduleEvent;
  orgId: string;
}

interface TierResetEvent {
  action: ScheduleEvent;
  orgId: string;
  userId: string;
  tier: MemberTier;
}

const scheduledEvents = async (event) => {
  const context = await createContext();
  const { action, orgId, ...eventParams } = JSON.parse(event) as ParsedEvent | TierResetEvent;
  if (action === ScheduleEvent.LOTTO_END) {
    const command = new StartExecutionCommand({
      stateMachineArn: process.env.LOTTO_STEP_FUNCTION_ARN,
      input: JSON.stringify({
        orgId,
      }),
    });
    await client.send(command);
  } else if (action === ScheduleEvent.USER_TIER_RETURN) {
    await context.users.resetUserTier({
      userId: (eventParams as TierResetEvent).userId,
      tier: (eventParams as TierResetEvent).tier,
    });
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from lotto',
      input: event,
    }, null, 2),
  };
};

export const handler = middy(scheduledEvents)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));