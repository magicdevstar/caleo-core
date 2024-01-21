import middy from '@middy/core';
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { ObjectId } from 'mongodb';
import difference from 'lodash.difference';
import shuffle from 'lodash.shuffle';
import uniqBy from 'lodash.uniqby';

import logger from '../utils/logger';
import { MemberTier, ShiftLotteryRequestStatus, ShiftStatus } from '../__generated__/resolvers-types';
import { createContext } from '../utils/createContext';
import { NotificationType, ShiftNotificationAction, ShiftUpsertNotification } from '../types/notifications';
import { LotteryState } from '../models/lotteryState';

interface InputEvent {
  _id: string;
  dryRun: boolean;
  reRun: boolean;
}

const lambda = new LambdaClient({});

const bucketAndShuffle = (requests: any[]) => {
  const bucket = requests.reduce((acc, req) => {
    if (!acc[req.order]) {
      acc[req.order] = [];
    }
    acc[req.order].push(req);
    return acc;
  }, {});

  let shuffledReq: any[] = [];

  Object.keys(bucket)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .forEach((key) => {
      shuffledReq.push(...shuffle(bucket[key]));
    });

  return shuffledReq;
}

const assignShift = async ({
  _id: shiftGroupId,
  dryRun,
  reRun,
}: InputEvent) => {
  const {
    shiftLotteryRequests: lottery,
    organizations,
    users,
    memberSkills,
    shifts: shiftsModel,
    assignments,
    lotteryState,
  } = await createContext();

  const shifts = await shiftsModel.findAllUnassignedShiftsByGroupId({
    shiftGroupId,
  });

  if (shifts.length === 0) {
    if (reRun) {
      return {
        tier1Assignments: [],
        dryRun: !!dryRun,
      }
    }
    throw new Error('Shifts not found');
  }
  
  // Fetch requests
  const organization = await organizations.get(shifts[0].orgId);
  if (!organization) {
    throw new Error('Organization not found');
  }

  const initialRequests = await lottery.requestsStagedForAssignment(shiftGroupId, reRun);
  const lotteryCounter = initialRequests?.[0]?.lotteryCounter;
  let state: LotteryState = {
    orgId: organization.id,
    assignedUsers: [],
    lotteryCounter,
  } as any;
  if (typeof lotteryCounter === 'number') {
    state = await lotteryState.getState(organization.id, lotteryCounter);
  }

  const {
    assignedUserRequests,
    unassignedUserRequests,
  } = initialRequests.reduce((acc, req) => {
    if (state.assignedUsers.includes(req.user.id)) {
      acc.assignedUserRequests.push(req);
    } else {
      acc.unassignedUserRequests.push(req);
    }
    return acc;
  }, {
    assignedUserRequests: [] as any,
    unassignedUserRequests: [] as any,
  });

  // Attempt to give everyone at least one shift before assigning a
  // shift to someone who has already received as shift during this lottery
  const tier1Requests = unassignedUserRequests.filter((request) => request.user?.member?.tier === MemberTier.Tier_1);
  const tier2Requests = unassignedUserRequests.filter((request) => request.user?.member?.tier === MemberTier.Tier_2);
  const assignedTier1Requests = assignedUserRequests.filter((request) => request.user?.member?.tier === MemberTier.Tier_1);
  const assignedTier2Requests = assignedUserRequests.filter((request) => request.user?.member?.tier === MemberTier.Tier_2);

  const allRequests: typeof tier1Requests = [
    ...bucketAndShuffle(tier1Requests),
    ...bucketAndShuffle(tier2Requests),
    ...bucketAndShuffle(assignedTier1Requests),
    ...bucketAndShuffle(assignedTier2Requests),
  ];

  const requests = uniqBy(allRequests, 'userId');

  logger.info('Lottery requests', {
    requests,
  });

  const assignment = await assignments.get(shifts[0].assignmentId);

  const tier1Assignments = new Set<string>();
  const shiftAssignments: any[] = [];
  const acceptedRequestIds: ObjectId[] = [];
  // Loop through requests, check if user can sign up for shift and assign the shift if so
  for(const request of requests) {
    if (!assignment?.rankIds?.includes(request.user?.member?.rankId)) {
      logger.info('Request rank does not match assignment rank', {  assignmentRankIds: assignment?.rankIds, requestRankId: request.user?.member?.rankId });
      continue;
    }
    if (assignment.requiredSkillIds && assignment.requiredSkillIds.length > 0) {
      const mSkills = await memberSkills.findAll(request.user?.member?.memberSkillIds.map((id) => new ObjectId(id)));
      const skillIds = mSkills.map(({ skillId }) => skillId);
      if (difference(assignment.requiredSkillIds, skillIds).length > 0) {
        logger.info('Request skills do not match assignment skills', {  assignmentSkillIds: assignment.requiredSkillIds, requestSkillIds: skillIds });
        continue;
      }
    }
    const { canSignUpForShift } = await shiftsModel.canSignUpForShift({
      user: request.user as any,
      shift: shifts[0],
      orgId: organization.id,
      shiftBufferTime: organization.settings?.shiftBuffer.enabled ? organization.settings?.shiftBuffer.minuteShiftBuffer : 0,
    });
    // This means we can assign this shift to this user
    if (canSignUpForShift) {
      const user = await users.get(request.user.id);
      if (!user) {
        continue;
      }
      const shift = shifts[0];
      const hasMaxShifts = await users.hasMaxShifts({
        user,
        shift,
        organization,
      });
      if (hasMaxShifts) {
        continue;
      }
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
        acceptedRequestIds.push(new ObjectId(request._id));
        state.assignedUsers.push(request.user.id);
        if (request.user?.member?.tier === MemberTier.Tier_1) {
          tier1Assignments.add(request.user.id);
        }
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

    for(const assignment of shiftAssignments) {
      const id = assignment.updateOne.filter._id.toString();
      await lambda.send(new InvokeCommand({
        FunctionName: process.env.SHIFT_NOTIFICATION_SCHEDULER,
        InvocationType: 'Event',
        Payload: JSON.stringify({
          type: NotificationType.Shift,
          action: ShiftNotificationAction.UpsertNotification,
          id,
        } as ShiftUpsertNotification),
      })).catch((error) =>
        logger.error('Error invoking shift notification scheduler', { error, id, assignment })
      );
    }
  }

  if (!dryRun) {
    // Remove all open requests for this shift group
    if (!reRun) {
      await lottery.removeMany({
        shiftGroupId: shiftGroupId,
        _id: {
          $nin: acceptedRequestIds,
        },
        status: ShiftLotteryRequestStatus.Pending
      }, {
        status: ShiftLotteryRequestStatus.Rejected,
      });
    }
  
    await lottery.removeMany({
      _id: {
        $in: acceptedRequestIds,
      },
      status: ShiftLotteryRequestStatus.Pending
    }, {
      status: ShiftLotteryRequestStatus.Approved,
    });
  }

  // Update lottery state we can do this in the dry run :)
  await lotteryState.saveState({
    ...state,
    assignedUsers: [...new Set(state.assignedUsers)],
  });

  return {
    orgId: organization?.id,
    tier1Assignments: [...tier1Assignments],
    dryRun: !!dryRun,
    acceptedRequestIds,
  };
};

export const handler = middy(assignShift)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
