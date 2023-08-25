import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';

import logger from './../utils/logger';
import { ScheduleEvent, SchedulerModel, Timezone } from '../models/scheduler';
import { ScheduleState } from '@aws-sdk/client-scheduler';
import { format } from 'date-fns';

interface Event {
  event: ScheduleEvent;
  orgId: string;
  eventTimeZone: Timezone;
  eventInput: any;
  enabled?: ScheduleState;
}

const testEvent = async (inputEvent: Event) => {
  const scheduler = new SchedulerModel();

  const date = new Date('2023-08-25T02:57:12.518Z');
  // const eventTime = `at(${format(date, 'yyyy-MM-dd')}T${format(date, 'hh:mm:ss')})`;
  const eventTime = `cron(${format(date, 'm')} ${format(date, 'h')} ? * 5 *)`
  const res = await scheduler.updateScheduledEvent({
    ...inputEvent,
    eventTime,
  });

  logger.info('testEvent', { res });

  return res;
};

export const handler = middy(testEvent)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));