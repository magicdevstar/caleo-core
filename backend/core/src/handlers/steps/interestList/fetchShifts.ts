import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';

import logger from '../../../utils/logger';
import { createContext } from '../../../utils/createContext';

interface InputEvent {
  orgId: string;
  eventId: string;
  dryRun?: boolean;
}

const fetchShifts = async ({ orgId, dryRun }: InputEvent) => {
  const { shifts } = await createContext();

  const { items } = await shifts.findOpenInterestListShiftsGroupedById({
    orgId,
  });

  return {
    orgId,
    dryRun,
    entries: items.map((item) => ({
      ...item,
      dryRun: !!dryRun,
    })),
  };
};

export const handler = middy(fetchShifts)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
