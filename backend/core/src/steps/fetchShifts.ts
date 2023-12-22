import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';

import logger from '../utils/logger';
import { createContext } from '../utils/createContext';

interface InputEvent {
  orgId: string;
  dryRun?: boolean;
}

const fetchShifts = async ({ orgId, dryRun }: InputEvent) => {
  const { shifts } = await createContext();

  const { items } = await shifts.findOpenLotteryShiftsGroupedById({
    orgId,
  });

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
