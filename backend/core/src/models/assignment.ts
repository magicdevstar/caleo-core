import { Db, ObjectId, PullOperator } from 'mongodb';
import { randomUUID as uuid } from 'crypto';
import DataLoader from 'dataloader';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import uniq from 'lodash/uniq';
import { Assignment, AssignmentAttachmentUpload, AssignmentSlotDetails, DocType } from '../__generated__/resolvers-types';
import { BaseMongo } from './base.v2';
import logger from '../utils/logger';
import { Action, MailerEvent, MailerEvents } from '../types/mailer';
import { IOrganization } from './organizations/organization.entity';
import { IAssignmentShiftSlots, IUser } from '../types/common';
import { IShift } from './shift';
import { IEvent } from './event';
import { DocumentModel } from './document';

const lambda = new LambdaClient({});

type IAssignmentSlotMap = Record<string, IShiftSlot[]>;
interface IShiftSlot { id: string; slotCount: number, slotDetails: AssignmentSlotDetails[] };

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
  'supervisorAssignmentId' |
  'supervisorAssignment' |
  'lieutenantAssignmentId' |
  'lieutenantAssignment' |
  'fieldSupervisorAssignmentId' |
  'fieldSupervisorAssignment' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  orgId: ObjectId;
  eventId: ObjectId;
  shiftIds: ObjectId[];
  requiredSkillIds: ObjectId[];
  requiredEquipmentIds?: ObjectId[];
  rankIds: ObjectId[];
  modifiedById: ObjectId;
  supervisorAssignmentId?: ObjectId;
  lieutenantAssignmentId?: ObjectId;
  fieldSupervisorAssignmentId?: ObjectId;
  shiftSlots?: {
    id?: ObjectId;
    slotCount: number;
  }[];

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export class AssignmentModel extends BaseMongo<IAssignment> {
  documentBasePath: string = 'assignments';

  public loadByEventId = new DataLoader(async (eventIds: readonly ObjectId[]) => {
    const res = await this.collection.find<IAssignment>({ eventId: { $in: eventIds }, removedAt: { $exists: false } }).toArray();

    const groupedByEventId: Record<string, IAssignment[]> = res.reduce((acc, assignment) => {
      const eId = assignment.eventId.toString();
      if (!acc[eId]) {
        acc[eId] = [];
      }
      acc[eId].push({
        ...assignment,
        id: assignment._id?.toString(),
      });
      return acc;
    }, {} as Record<string, IAssignment[]>);

    return eventIds.map((id) => groupedByEventId[id.toString()] || []);
  });

  constructor(db: Db, private document: DocumentModel) {
    super(db, DocType.Assignment, 'assignments');
  }

  async createTemplates({
    originalEventId,
    event,
    organization,
    user,
    updateEventPostAssignmentClone,
    shifts,
  }: {
    originalEventId: ObjectId;
    event: IEvent;
    organization: IOrganization;
    user: IUser;
    shifts: IShift[];
    updateEventPostAssignmentClone: (id: ObjectId, assignmentIds: ObjectId[], modifiedById: ObjectId, otherSetValues: Record<string, any>) => Promise<void>;
  }) {
    const {
      items: originalAssignments,
    } = await this.search({
      eventId: originalEventId,
      orgId: organization._id,
      order: '_id',
      orderBy: 'asc',
    });

    const result: IAssignmentSlotMap = {};

    shifts.forEach((shift) => {
      const { assignmentId: aId, shiftId } = shift;
      const assignmentId = aId.toString();

      if (!result[assignmentId]) {
        result[assignmentId] = [] as IShiftSlot[];
      }

      const existingShift = result[assignmentId].find(s => s.id === shiftId);

      if (existingShift) {
        existingShift.slotDetails.push({
          index: existingShift.slotCount,
          callSign: shift.callSign,
          customId: shift.customId,
          locked: shift.locked,
        });
        existingShift.slotCount += 1;
      } else {
        result[assignmentId].push({
          id: shiftId,
          slotCount: 1,
          slotDetails: [
            {
              index: 0,
              callSign: shift.callSign,
              customId: shift.customId,
              locked: shift.locked,
            }
          ],
        });
      }
    });

    const idMap: Record<string, ObjectId> = {};
    // Create a map of original assignment IDs to new ObjectIds
    originalAssignments.forEach((assignment) => {
      idMap[assignment.id!] = new ObjectId();
    });

    const assignmentTemplates = originalAssignments.map(({
      id,
      _id,
      eventId: _,
      shiftIds,
      shiftSlots,
      createdAt,
      updatedAt,
      removedAt,
      modifiedById,
      ...a
    }) => ({
      ...a,
      _id: idMap[id!],
      ...(a.supervisorAssignmentId && { supervisorAssignmentId: idMap[a.supervisorAssignmentId.toString()] }),
      ...(a.lieutenantAssignmentId && { lieutenantAssignmentId: idMap[a.lieutenantAssignmentId.toString()] }),
      ...(a.fieldSupervisorAssignmentId && { fieldSupervisorAssignmentId: idMap[a.fieldSupervisorAssignmentId.toString()] }),
      eventId: event._id,
      shiftSlots: result[id!] || [],
      shiftIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      modifiedById: user._id,
    }));

    const res = await this.collection.insertMany(assignmentTemplates);
    const finalAssignmentIds = Object.values(res.insertedIds);

    // Add assignmentIds to event once they have been created
    await updateEventPostAssignmentClone(
      event._id!,
      finalAssignmentIds,
      user._id!,
      {
        supervisorAssignmentId: idMap[event?.supervisorAssignmentId?.toString?.() || '-'] || undefined,
        lieutenantAssignmentId: idMap[event?.lieutenantAssignmentId?.toString?.() || '-'] || undefined,
        fieldSupervisorAssignmentId: idMap[event?.fieldSupervisorAssignmentId?.toString?.() || '-'] || undefined,
      },
    );

    return res;
  }

  async cloneAssignmentsByEvent({
    originalEventId,
    event,
    organization,
    user,
    updateEventPostAssignmentClone,
    generateSlots,
  } : {
    originalEventId: ObjectId;
    event: IEvent;
    organization: IOrganization;
    user: IUser;
    generateSlots: (assignmentId: ObjectId) => Promise<IAssignmentShiftSlots[]>;
    updateEventPostAssignmentClone: (id: ObjectId, assignmentIds: ObjectId[], modifiedById: ObjectId, otherSetValues: Record<string, any>) => Promise<void>;
  }) {
    const {
      items: originalAssignments,
    } = await this.search({
      eventId: originalEventId,
      orgId: organization._id,
      order: '_id',
      orderBy: 'asc',
    });

    const idMap: Record<string, ObjectId> = {};
    // Create a map of original assignment IDs to new ObjectIds
    originalAssignments.forEach((assignment) => {
      idMap[assignment.id!] = new ObjectId();
    });

    // If the assignment doesn't have a shift slots attached we will need to create them
    const assignmentTemplates = await Promise.all(
      originalAssignments.map(async ({
        id,
        _id,
        createdAt,
        updatedAt,
        removedAt,
        eventId: originalEventId,
        modifiedById,
        shiftIds,
        ...assignment
      }) => {
        if (!assignment.shiftSlots || assignment.shiftSlots?.length === 0) {
          assignment.shiftSlots = await generateSlots(_id!);
        }
        return {
          ...assignment,
          _id: idMap[id!],
          ...(assignment.supervisorAssignmentId && { supervisorAssignmentId: idMap[assignment.supervisorAssignmentId.toString()] }),
          ...(assignment.lieutenantAssignmentId && { lieutenantAssignmentId: idMap[assignment.lieutenantAssignmentId.toString()] }),
          ...(assignment.fieldSupervisorAssignmentId && { fieldSupervisorAssignmentId: idMap[assignment.fieldSupervisorAssignmentId.toString()] }),
          shiftIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          eventId: event._id,
          modifiedById: user._id,
          orgId: organization._id,
        };
      })
    );

    const assignments = await this.collection.insertMany(assignmentTemplates);

    // Add assignmentIds to event once they have been created
    await updateEventPostAssignmentClone(
      event._id!,
      Object.values(assignments.insertedIds),
      user._id!,
      {
        supervisorAssignmentId: idMap[event?.supervisorAssignmentId?.toString?.() || '-'] || undefined,
        lieutenantAssignmentId: idMap[event?.lieutenantAssignmentId?.toString?.() || '-'] || undefined,
        fieldSupervisorAssignmentId: idMap[event?.fieldSupervisorAssignmentId?.toString?.() || '-'] || undefined,
      }
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
    // Omitting description incase it is too large to send to the mailer
    // We don't need this information in the email.
    const { description, ...assign } = assignment;
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA!,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template: MailerEvents.OfficerAssignmentRemoved,
        data: {
          assignment: assign,
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
      ] as string[]).map((id: string) => new ObjectId(id));
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
      } as PullOperator<Document>,
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

  async getSigningAuthorityUser(assignmentId?: ObjectId) {
    if (!assignmentId) {
      return null;
    }
    const user = await this.collection.aggregate<IUser>([
      {
        $match: {
          _id: assignmentId,
          isSigningAuthority: true,
          removed: { $exists: false },
        },
      },
      {
        $lookup: {
          from: 'shifts',
          localField: "_id",
          foreignField: "assignmentId",
          as: "shifts",
        }
      },
      // Step 3: Add a field for the first matching shift
      {
        $addFields: {
          shift: {
            $first: {
              $filter: {
                input: '$shifts',
                as: 'shift',
                cond: {
                  $and: [
                    { $ne: ['$$shift.userId', null] },
                    { $not: { $ifNull: ['$$shift.removedAt', false] } },
                  ],
                },
              },
            },
          },
        },
      },

      // Step 4: Lookup user from the `users` collection using shift.userId
      {
        $lookup: {
          from: 'users',
          localField: 'shift.userId',
          foreignField: '_id',
          as: 'user',
        },
      },

      // Optional: Flatten user array
      {
        $addFields: {
          user: { $first: '$user' },
        },
      },
      {
        $replaceWith: '$user',
      },
    ]).toArray();

    return user[0] || null;
  }

  async signingAuthorityAssignments(eventId: ObjectId) {
    return this.search({
      eventId,
      isSigningAuthority: true,
    });
  }

  async getDownloadUrl(attachmentPath: string) {
    return this.document.getDownloadUrl(attachmentPath);
  };

  async getUploadUrl({
    orgId,
  }: {
    orgId: ObjectId;
  }): Promise<AssignmentAttachmentUpload> {
    const attachmentPath = `${orgId.toString()}/${this.documentBasePath}/${uuid()}`;
    const uploadUrl = await this.document.getUploadUrl(attachmentPath);
    return {
      attachmentPath,
      uploadUrl,
    };
  };
};
