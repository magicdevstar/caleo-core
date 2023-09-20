import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';

import logger from '../utils/logger';
import { DocType, EventStatus } from '../__generated__/resolvers-types';
import { createContext } from '../utils/createContext';

interface InputEvent {
  orgId: string;
};

const updateAllEvents = async (input: InputEvent[]) => {
  const orgId = input?.[0]?.orgId;
  // Skip if no orgId. This can happen if there are no events to rank :)
  if (!orgId) {
    return;
  }
  const { events } = await createContext();

  await events.collection.updateMany({
    orgId,
    docType: DocType.Event,
    status: EventStatus.ReadyForLottery,
  }, {
    $set: { status: EventStatus.FirstComeFirstServe },
  });
};

export const handler = middy(updateAllEvents)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
