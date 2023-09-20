import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';

import logger from '../utils/logger';
import { createContext } from '../utils/createContext';

interface InputEvent {
  orgId: string;
}

const fetchShifts = async ({ orgId }: InputEvent) => {
  const { shifts } = await createContext();

  const { items } = await shifts.findOpenLotteryShiftsGroupedById({
    orgId,
  });

  logger.info('Shifts', { items });

  return items;
};

export const handler = middy(fetchShifts)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
