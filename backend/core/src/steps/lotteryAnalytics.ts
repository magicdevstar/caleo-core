import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';

import logger from '../utils/logger';
import { createContext } from '../utils/createContext';
import { FinalizeOutput } from './finalizeLottery';

const lotteryAnalytics = async ({
  orgId,
  dryRun,
  previousCounter,
}: FinalizeOutput) => {
  try {
    if (!orgId || dryRun || typeof previousCounter !== 'number') {
      return;
    }
    const context = await createContext();
    await context.analytics.createPostLotteryAnalytics({
      orgId,
      lotteryCounter: previousCounter,
    });
  } catch(error) {
    logger.error('Failed to generate analytics', { error });
  }
};

export const handler = middy(lotteryAnalytics)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
