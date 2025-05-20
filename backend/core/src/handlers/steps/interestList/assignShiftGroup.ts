import middy from '@middy/core';
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { ObjectId } from 'mongodb';
import difference from 'lodash.difference';

import logger from '../../../utils/logger';
import { createContext } from '../../../utils/createContext';
import { IShift } from '../../../models/shift';
import { NotificationType, ShiftNotificationAction, ShiftUpsertNotification } from '../../../types/notifications';
import { ShiftInterestRequestStatus, ShiftStatus } from '../../../__generated__/resolvers-types';
import { Action, MailerEvent, MailerEvents } from '../../../types/mailer';

interface InputEvent {
  _id: string;
  dryRun: boolean;
}

const lambda = new LambdaClient({});

const assignShiftGroup = async ({
  _id: shiftGroupId,
  dryRun,
}: InputEvent) => {
  const {
    shiftInterestRequests: interest,
    interestList,
    organizations,
    users,
    memberSkills,
    memberEquipments,
    shifts: shiftsModel,
    assignments,
  } = await createContext();

  const shifts = await shiftsModel.findAllUnassignedShiftsByGroupId({
    shiftGroupId,
  });

  if (shifts.length === 0) {
    const shift = await shiftsModel.collection.findOne<IShift>({ shiftId: shiftGroupId });
    return {
      orgId: shift?.orgId || shifts[0].orgId,
      dryRun: !!dryRun,
    }
  }

  const organization = await organizations.get(shifts[0].orgId);
  if (!organization) {
    throw new Error('Organization not found');
  }

  const requests = await interestList.sortedInterestRequests({
    org: organization,
    sampleShift: shifts[0],
  });

  const assignment = await assignments.get(shifts[0].assignmentId);
  const assignmentRankIds = (assignment?.rankIds || []).map((id) => id.toString());
  const assignmentSkillIds = (assignment?.requiredSkillIds || []).map((id) => id.toString());
  const assignmentEquipmentIds = (assignment?.requiredEquipmentIds || []).map((id) => id.toString());

  const shiftAssignments: any[] = [];
  const acceptedRequestUpdates: any[] = [];

  for(const request of requests) {
    if (!assignmentRankIds.includes(request.user?.member?.rankId.toString())) {
      logger.info('Request rank does not match assignment rank', { assignmentRankIds, requestRankId: request.user?.member?.rankId });
      continue;
    }
    if (assignmentSkillIds.length > 0) {
      const mSkills = await memberSkills.findAll(request.user?.member?.memberSkillIds.map((id) => new ObjectId(id)));
      const skillIds = mSkills.map(({ skillId }) => skillId.toString());
      if (difference(assignmentSkillIds, skillIds).length > 0) {
        logger.info('Request skills do not match assignment skills', {  assignmentSkillIds, requestSkillIds: skillIds });
        continue;
      }
    }
    if (assignmentEquipmentIds.length > 0) {
      const mEquipment = await memberEquipments.findAll(request.user?.member?.memberEquipmentIds.map((id) => new ObjectId(id)));
      const equipmentIds = mEquipment.map(({ equipmentId }) => equipmentId.toString());
      if (difference(assignmentEquipmentIds, equipmentIds).length > 0) {
        logger.info('Request equipment does not match assignment equipment', { assignmentEquipmentIds, requestEquipmentIds: equipmentIds });
        continue;
      }
    }

    const { canSignUpForShift } = await shiftsModel.canSignUpForShift({
      user: request.user as any,
      shift: shifts[0],
      orgId: organization.id,
      shiftBufferTime: organization.settings?.shiftBuffer.enabled ? organization.settings?.shiftBuffer.minuteShiftBuffer : 0,
    });

    // TODO: Do not allow signing up for the same event?

    // This means we can assign this shift to this user
    if (canSignUpForShift) {
      const user = await users.get(request.user.id!);
      if (!user) {
        continue;
      }
      const shift = shifts[0];
      const hasMaxHours = await users.hasMaxHours({
        user,
        shift,
        organization,
      });
      const hasMaxShifts = await users.hasMaxShifts({
        user,
        shift,
        organization,
      });
      if (hasMaxShifts || hasMaxHours) {
        continue;
      }
      // Remove shift from list
      const pendingShift = shifts.pop();
      if (pendingShift) {
        shiftAssignments.push({
          updateOne: {
            filter: { _id: new ObjectId(pendingShift._id) },
            update: {
              $set: {
                userId: new ObjectId(request.userId),
                status: ShiftStatus.Assigned,
                updatedAt: new Date(),
              }
            },
          },
        });
        acceptedRequestUpdates.push({
          updateOne: {
            filter: { _id: new ObjectId(request._id) },
            update: {
              $set: {
                assignedShiftId: new ObjectId(pendingShift._id),
                status: ShiftInterestRequestStatus.Approved,
                updatedAt: new Date(),
              }
            }
          }
        });
      }
    }
    // If we don't have any more shifts to assign break here
    if (shifts.length === 0) {
      break;
    }
  }

  logger.info('Shift assignments', {
    shiftAssignments,
    dryRun: !dryRun,
  });
  if (shiftAssignments.length > 0 && !dryRun) {
    const res = await shiftsModel.collection.bulkWrite(shiftAssignments);
    const interestBulkUpdate = await interest.collection.bulkWrite(acceptedRequestUpdates);
    logger.info('Bulk write res', { res, interestBulkUpdate });

    // Send assignment email and in app notifications
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA!,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template: MailerEvents.OfficerNewShiftAssignments,
        data: {
          organization,
          shiftAssignments,
        }
      } as MailerEvent),
    }));

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

  return {
    orgId: organization?.id,
    dryRun: !!dryRun,
    acceptedRequestIds: acceptedRequestUpdates.map((update) => update.updateOne.filter._id),
  };
};

export const handler = middy(assignShiftGroup)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
