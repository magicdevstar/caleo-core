import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';

import logger from '../../../utils/logger';
import { createContext } from '../../../utils/createContext';
import { EventStatus } from '../../../__generated__/resolvers-types';

const markEventsAsComplete = async () => {
  const { events } = await createContext();

  logger.setLogLevel('INFO');

  const res = await events.collection.updateMany({
    endTime: { $lte: new Date() },
    status: { $in: [EventStatus.Draft, EventStatus.FirstComeFirstServe] }
  }, {
    $set: {
      status: EventStatus.Complete,
    },
  });

  logger.info('Event status set', { res });
};

export const handler = middy(markEventsAsComplete)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
