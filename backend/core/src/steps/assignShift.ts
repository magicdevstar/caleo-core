import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { ObjectId } from 'mongodb';

import logger from '../utils/logger';
import { DocType, Shift, ShiftStatus } from '../__generated__/resolvers-types';
import { createContext } from '../utils/createContext';

interface InputEvent {
  _id: string;
  shifts: Shift[];
  dryRun: boolean;
}

const assignShift = async ({ _id: shiftGroupId, shifts, dryRun }: InputEvent) => {
  const {
    shiftLotteryRequests: lottery,
    organizations,
    users,
    shifts: shiftsModel,
  } = await createContext();
  
  // Fetch requests
  const organization = await organizations.get(shifts[0].orgId);
  const requests = await lottery.requestsStagedForAssignment(shiftGroupId);

  logger.info('Lottery requests', {
    requests,
  });

  const shiftAssignments: any[] = [];
  // Loop through requests, check if user can sign up for shift and assign the shift if so
  for(const request of requests) {
    const { total } = await users.findOpenShifts({
      user: request.user as any,
      organization: organization!,
      orgId: organization!.id,
      limit: 1,
      skip: 0,
      shiftGroupId,
      defaultEventIds: [shifts[0].eventId],
    });
    logger.info('Available for request', {
      total,
      request,
    });
    // This means we can assign this shift to this user
    if (total !== 0) {
      // Remove shift from list
      const pendingShift: any = shifts.pop();
      if (pendingShift) {
        logger.info('Pending shift', { pendingShift });
        shiftAssignments.push({
          updateOne: {
            filter: { _id: new ObjectId(pendingShift._id) },
            update: { $set: { userId: request.userId.toString(), status: ShiftStatus.Assigned } },
          },
        });
      }
    }
    // If we don't have any more shifts to assign break here
    if (shifts.length === 0) {
      break;
    }
  }

  // Assign the shifts
  logger.info('Shift assignments', {
    shiftAssignments,
    dryRun: !dryRun,
  });
  if (shiftAssignments.length > 0 && !dryRun) {
    const res = await shiftsModel.collection.bulkWrite(shiftAssignments);
    logger.info('Bulk write res', { res });
  }

  // Remove all open requests for this shift group
  await lottery.collection.deleteMany({
    shiftGroupId: shiftGroupId,
  });

  return {
    orgId: organization?.id,
  };
};

export const handler = middy(assignShift)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
