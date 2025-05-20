import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';

import logger from '../../../utils/logger';
import { createContext } from '../../../utils/createContext';
import { addHours, addSeconds, setMilliseconds, setSeconds } from 'date-fns';
import { EventStatus } from '../../../__generated__/resolvers-types';
import { ObjectId } from 'mongodb';

interface InputEvent {
  entries: InputEntries[];
  orgId: string;
  dryRun?: boolean;
};

interface InputEntries {
  orgId: string;
  tier1Assignments: string[];
  dryRun?: boolean;
}

export interface FinalizeOutput {
  orgId?: string;
  dryRun: boolean;
  fcfsDelay: string;
  previousCounter?: number;
  totalUnassignedShifts: number;
}

const formatDate = (d: Date) => `${d.toISOString().split('.')[0]}Z`;

const finalizeLottery = async (input: InputEvent): Promise<FinalizeOutput> => {
  const orgId = input?.orgId;
  const dryRun = input?.dryRun;
  // Skip if no orgId. This can happen if there are no events to rank :)
  if (!orgId || !!dryRun) {
    return {
      dryRun: !!dryRun,
      fcfsDelay: formatDate(addSeconds(new Date(), 15)),
      totalUnassignedShifts: 0,
    };
  }
  const {
    users,
    organizations,
    lotteryCounter,
    events,
    shifts,
  } = await createContext();
  const organization = await organizations.get(orgId);
  if (!organization) {
    throw new Error(`Organization ${orgId} not found`);
  }

  const { counter } = await lotteryCounter.increment(new ObjectId(orgId));

  // Set user tiers
  const tier1Assignments = input.entries.map(({ tier1Assignments }) => tier1Assignments).flat();
  if (tier1Assignments.length > 0) {
    await users.setTiersPostLottery({ tier1Assignments, orgId });
  }

  const fcfsScheduledTime = setMilliseconds(
    setSeconds(
      // addSeconds(new Date(), 30),
      addHours(new Date(), organization.settings?.lottery.fcfsShiftsDelay || 1),
      0
    ),
    0
  );
  const fcfsDelay = formatDate(fcfsScheduledTime);

  // Set all events as FCFS and schedule them
  const fcfsResponse = await events.collection.updateMany({
    orgId: new ObjectId(orgId),
    status: EventStatus.ReadyForLottery,
    lotteryNumber: counter - 1,
  }, {
    $set: {
      status: EventStatus.FirstComeFirstServe,
      scheduledFirstComeFirstServe: fcfsScheduledTime,
    },
  });

  // Get all unassigned shifts
  const totalUnassignedShifts = await shifts.getTotalEmptyShiftsPostLottery({
    counter: counter - 1,
    orgId,
  });

  logger.info('Set events to FCFS', { 
    fcfsResponse,
    fcfsScheduledTime,
  });

  return {
    orgId,
    dryRun: !!dryRun,
    fcfsDelay,
    previousCounter: counter - 1,
    totalUnassignedShifts,
  };
};

export const handler = middy(finalizeLottery)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
