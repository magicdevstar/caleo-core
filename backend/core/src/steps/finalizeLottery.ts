import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';

import logger from '../utils/logger';
import { createContext } from '../utils/createContext';
import { addHours, addSeconds } from 'date-fns';

interface InputEvent {
  orgId: string;
  tier1Assignments: string[];
};

export interface FinalizeOutput {
  orgId?: string;
  fcfsDelay: string;
  previousCounter?: number;
}

const formatDate = (d: Date) => `${d.toISOString().split('.')[0]}Z`;

const finalizeLottery = async (input: InputEvent[]): Promise<FinalizeOutput> => {
  const orgId = input?.[0]?.orgId;
  // Skip if no orgId. This can happen if there are no events to rank :)
  if (!orgId) {
    return {
      fcfsDelay: formatDate(addSeconds(new Date(), 15)),
    };
  }
  const { users, organizations, lotteryCounter } = await createContext();
  const organization = await organizations.get(orgId);
  if (!organization) {
    throw new Error(`Organization ${orgId} not found`);
  }

  const { counter } = await lotteryCounter.increment(orgId);

  // Set user tiers
  const tier1Assignments = input.map(({ tier1Assignments }) => tier1Assignments).flat();
  await users.setTiersPostLottery({ tier1Assignments, orgId });

  const fcfsDelay = formatDate(addHours(new Date(), organization.settings?.lottery.fcfsShiftsDelay || 1));

  return {
    orgId,
    fcfsDelay,
    previousCounter: counter - 1,
  };
};

export const handler = middy(finalizeLottery)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
