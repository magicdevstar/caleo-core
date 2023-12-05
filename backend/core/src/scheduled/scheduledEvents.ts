import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

import logger from '../utils/logger';
import { ScheduleEvent } from '../models/scheduler';
import { createContext } from '../utils/createContext';
import { MemberStatus, MemberTier } from '../__generated__/resolvers-types';
import { Action, MailerEvents, MailerEvent } from '../types/mailer';

const client = new SFNClient({});
const lambda = new LambdaClient({});

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

interface InactiveResetEvent {
  action: ScheduleEvent;
  orgId: string;
  userId: string;
  status: MemberStatus;
}

interface ShiftReminderEvent {
  action: ScheduleEvent;
  orgId: string;
  shift: {
    id: string;
    userId: string;
  };
}

const scheduledEvents = async (event) => {
  const context = await createContext();
  const { action, orgId, ...eventParams } = JSON.parse(event) as ParsedEvent | TierResetEvent | ShiftReminderEvent;
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
  } else if (action === ScheduleEvent.USER_INACTIVE_RETURN) {
    await context.users.setStatus({
      userId: (eventParams as TierResetEvent).userId,
      status: (eventParams as InactiveResetEvent).status,
    });
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA!,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template: MailerEvents.OfficerUserAccountReactivated,
        data: {
          user: {
            id: (eventParams as InactiveResetEvent).userId,
          },
          orgId: (eventParams as InactiveResetEvent).orgId,
        },
      } as MailerEvent),
    }));
  } else if (action === ScheduleEvent.SHIFT_REMINDER) {
    const { shift: { id, userId } } = eventParams as ShiftReminderEvent;
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template: MailerEvents.OfficerShiftStartingNotification,
        data: {
          userId,
          shiftId: id,
        },
      } as MailerEvent),
    }));
  } else if (action === ScheduleEvent.LOTTO_NOTIFY) {
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template: MailerEvents.LotteryWindowClosing,
        data: {
          orgId,
        },
      } as MailerEvent),
    }));
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