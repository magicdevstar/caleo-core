import { Db, ObjectId } from 'mongodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import uniq from 'lodash.uniq';
import { Assignment, DocType, User } from '../__generated__/resolvers-types';
import { BaseMongo } from './base.v2';
import logger from '../utils/logger';
import { Action, MailerEvent, MailerEvents } from '../types/mailer';
import { IOrganization } from './organization';
import { IUser } from '../types/common';

const lambda = new LambdaClient({});

export interface IAssignment extends Omit<
  Assignment,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'orgId' |
  'org' |
  'eventId' |
  'event' |
  'shifts' |
  'shiftIds' |
  'requiredSkills' |
  'requiredSkillIds' |
  'requiredEquipmentIds' |
  'requiredEquipment' |
  'shiftSlots' |
  'ranks' |
  'rankIds' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  userId: ObjectId;
  orgId: ObjectId;
  eventId: ObjectId;
  shiftIds: ObjectId[];
  requiredSkillIds: ObjectId[];
  requiredEquipmentIds?: ObjectId[];
  rankIds: ObjectId[];
  modifiedById: ObjectId;
  assignmentId: ObjectId;
  shiftSlots: {
    id?: ObjectId;
    slotCount: number;
  }[];

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export class AssignmentModel extends BaseMongo<IAssignment> {
  constructor(db: Db) {
    super(db, DocType.Assignment, 'assignments');
  }

  async cloneAssignmentsByEvent({
    originalEventId,
    eventId,
    organization,
    user,
    addAssignmentIds,
  } : {
    originalEventId: ObjectId;
    eventId: ObjectId;
    organization: IOrganization;
    user: IUser;
    addAssignmentIds: (id: ObjectId, assignmentIds: ObjectId[], modifiedById: ObjectId) => Promise<void>;
  }) {
    const {
      items: originalAssignments,
    } = await this.search({
      eventId: originalEventId,
      orgId: organization._id,
    });

    const assignmentTemplates = originalAssignments.map(({
      id,
      _id,
      createdAt,
      updatedAt,
      removedAt,
      eventId: originalEventId,
      modifiedById,
      shiftIds,
      ...assignment
    }) => ({
      ...assignment,
      createdAt: new Date(),
      updatedAt: new Date(),
      eventId,
      modifiedById: user._id,
      orgId: organization._id,
    }));

    const assignments = await this.collection.insertMany(assignmentTemplates);

    // Add assignmentIds to event once they have been created
    await addAssignmentIds(
      eventId,
      Object.values(assignments.insertedIds),
      user._id!,
    );

    return assignments;
  }

  async removeAssignment({
    assignment,
    organization,
    user,
  }: {
    assignment: IAssignment;
    organization: IOrganization;
    user: IUser;
  }) {
    await this.remove(assignment.id!, { modifiedById: user._id });
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA!,
      InvocationType: 'Event',
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

  async linkShifts(
    shiftIds: string[],
    assignment: IAssignment,
    modifiedById: ObjectId,
    removeSlots: boolean = false,
  ) {
    const currentShiftIds = (assignment.shiftIds || []).map((id) => id.toString());
    const newIds = shiftIds.filter((id) => !currentShiftIds.includes(id));
    if (newIds.length > 0) {
      const shiftIds = uniq([
        ...currentShiftIds,
        ...newIds
      ] as string[]).map((id) => new ObjectId(id));
      this.collection.updateOne({ _id: new ObjectId(assignment.id) }, {
        $set: {
          shiftIds,
          modifiedById: modifiedById,
          updatedAt: new Date(),
        },
        ...(removeSlots ? {
          $unset: {
            shiftSlots: '',
          },
        }: {}),
      });
    }
  }

  async removeShifts(assignmentId: ObjectId, shiftIds: ObjectId[], modifiedById: ObjectId) {
    await this.collection.updateOne({
      _id: assignmentId,
    }, {
      $pull: {
        shiftIds: {
          $in: shiftIds,
        },
      },
      $set: {
        modifiedById,
      },
    });
  }

  async removeAllByEventId(orgId: string, eventId: string, modifiedById: ObjectId) {
    const assignmentRes = await this.removeMany({
      orgId: new ObjectId(orgId),
      eventId: new ObjectId(eventId),
    }, {
      modifiedById: modifiedById,
    });

    if (assignmentRes.modifiedCount === 0) {
      logger.warn('No assignments removed', {
        orgId,
        eventId,
      });
    }
  }
};
