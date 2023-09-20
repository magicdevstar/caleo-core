import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

import logger from './../utils/logger';
import { ScheduleEvent } from '../models/scheduler';

const client = new SFNClient({});

interface ParsedEvent {
  action: ScheduleEvent;
  orgId: string;
}

const lottoEvent = async (event) => {
  const { action, orgId } = JSON.parse(event) as ParsedEvent;
  if (action === ScheduleEvent.LOTTO_END) {
    const command = new StartExecutionCommand({
      stateMachineArn: process.env.LOTTO_STEP_FUNCTION_ARN,
      input: JSON.stringify({
        orgId,
      }),
    });
    await client.send(command);
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from lotto',
      input: event,
    }, null, 2),
  };
};

export const handler = middy(lottoEvent)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));