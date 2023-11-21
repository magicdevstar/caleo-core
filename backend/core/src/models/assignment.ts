import { Db } from 'mongodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import uniq from 'lodash.uniq';
import { Assignment, DocType, Organization, User } from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import logger from '../utils/logger';
import { Action, MailerEvent, MailerEvents } from '../types/mailer';
import { ShiftModel } from './shift';

const lambda = new LambdaClient({});

export class AssignmentModel extends BaseModel<Assignment> {
  constructor(db: Db) {
    super(db, DocType.Assignment, 'assignments');
  }

  async removeAssignment({
    assignment,
    organization,
    user,
  }: {
    assignment: Assignment;
    organization: Organization;
    user: User;
  }) {
    await this.remove(assignment.id, { modifiedById: user.id });
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA!,
      Payload: JSON.stringify({
        action: Action.Email,
        template: MailerEvents.OfficerAssignmentRemoved,
        data: {
          assignment,
          organization,
          modifiedById: user.id,
        },
      } as MailerEvent),
    }));
  }

  async linkShifts(shiftIds: string[], assignment: Assignment, modifiedById: string) {
    const currentShiftIds = assignment.shiftIds || [];
    const newIds = shiftIds.filter((id) => !currentShiftIds.includes(id));
    if (newIds.length > 0) {
      const shiftIds = uniq([...currentShiftIds, ...newIds]);
      await this.update({
        ...assignment,
        shiftIds,
        modifiedById,
      }, { skipMerge: true });
    }
  }

  async removeShifts(assignmentId: string, shiftIds: string[], modifiedById: string) {
    const assignment = await this.get(assignmentId);
    if (assignment) {
      await this.update({
        ...assignment,
        shiftIds: (assignment.shiftIds || []).filter((sid) => !shiftIds.includes(sid as string)),
        modifiedById,
      } as any, { skipMerge: true });
    }
  }

  async removeAllByEventId(orgId: string, eventId: string, modifiedById: string) {
    const assignmentRes = await this.removeMany({
      orgId,
      eventId,
    }, {
      modifiedById,
    });

    if (assignmentRes.modifiedCount === 0) {
      logger.warn('No assignments removed', {
        orgId,
        eventId,
      });
    }
  }
};
