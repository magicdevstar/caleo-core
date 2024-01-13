import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';

import logger from '../utils/logger';
import { createContext } from '../utils/createContext';

interface InputEvent {
  orgId: string;
  dryRun?: boolean;
}

const fetchShifts = async ({ orgId, dryRun }: InputEvent) => {
  const { shifts, lotteryState } = await createContext();

  const { items, lotteryCounter } = await shifts.findOpenLotteryShiftsGroupedById({
    orgId,
  });

  // Init lottery state where we can store all of the assignments
  await lotteryState.initialize(orgId, lotteryCounter);

  logger.info('Shifts', { items });

  return items.map((item) => ({
    ...item,
    dryRun: !!dryRun,
  }));
};

export const handler = middy(fetchShifts)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
