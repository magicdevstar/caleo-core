import { Db, ObjectId } from 'mongodb';
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import {
  ShiftBufferRequest,
  DocType,
  ShiftBufferRequestStatus,
  Shift,
  User,
  Organization,
  CreateShiftBufferRequest
} from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import { Action, MailerEvent, MailerEvents } from '../types/mailer';
import { BaseMongo } from './base.v2';
import { IOrganization } from './organization';
import { IUser } from '../types/common';
import { IShift } from './shift';

const lambda = new LambdaClient({});

export interface IShiftBufferRequest extends Omit<
  ShiftBufferRequest,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'orgId' |
  'org' |
  'shiftId' |
  'shift' |
  'shiftBufferShiftId' |
  'shiftBufferShift' |
  'eventId' |
  'event' |
  'assignmentId' |
  'assignment' |
  'userId' |
  'user' |
  'startTime' |
  'endTime' |
  '__typename'
> {
  _id?: ObjectId;
  id: string;
  orgId: ObjectId;
  modifiedById: ObjectId;
  shiftId: ObjectId;
  shiftBufferShiftId: ObjectId;
  eventId: ObjectId;
  assignmentId: ObjectId;
  userId: ObjectId;

  startTime: Date;
  endTime: Date;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export class ShiftBufferRequestModel extends BaseMongo<IShiftBufferRequest> {
  constructor(db: Db) {
    super(db, DocType.ShiftBufferRequest, 'shiftBufferRequests');
  }

  async updateWithNotification({
    request,
    shift,
    user,
    organization,
  }: {
    request: IShiftBufferRequest;
    shift: IShift;
    user: IUser;
    organization: IOrganization;
  }) {
    await this.update(request);

    if (
      request.status === ShiftBufferRequestStatus.Approved ||
      request.status === ShiftBufferRequestStatus.Rejected
    ) {
      const template = request.status === ShiftBufferRequestStatus.Approved ?
        MailerEvents.OfficerPendingShiftApproved :
        MailerEvents.OfficerPendingShiftDenied;
      await lambda.send(new InvokeCommand({
        FunctionName: process.env.MAILER_LAMBDA!,
        InvocationType: 'Event',
        Payload: JSON.stringify({
          action: Action.Email,
          template,
          data: {
            shift,
            user,
            request,
            organization,
          },
        } as MailerEvent),
      }));
    }

    return request;
  }

  async createWithNotification({
    shiftBufferRequest,
    shiftBufferShift,
    shift,
    user,
    organization
  } : {
    shiftBufferRequest: CreateShiftBufferRequest;
    shiftBufferShift: IShift;
    shift: IShift;
    user: IUser;
    organization: IOrganization;
  }) {
    const createdShiftBuffer = await this.create({
      shiftId: new ObjectId(shift.id),
      shiftGroupId: shift.shiftId,
      eventId: new ObjectId(shift.eventId),
      startTime: new Date(shift.startTime),
      endTime: new Date(shift.endTime),
      shiftBufferShiftId: new ObjectId(shiftBufferRequest.shiftBufferShiftId),
      status: ShiftBufferRequestStatus.Pending,
      assignmentId: new ObjectId(shift.assignmentId),
      note: shiftBufferRequest.note,
      orgId: new ObjectId(shift.orgId),
      userId: user?._id,
      modifiedById: user?._id,
    } as IShiftBufferRequest);

    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA!,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template: MailerEvents.AdminPendingShiftRequested,
        data: {
          shift,
          shiftBufferShift,
          createdShiftBuffer,
          user,
          organization,
        },
      } as MailerEvent),
    }));

    return createdShiftBuffer;
  }

  async removeByShiftId(shiftId: string, modifiedById: ObjectId) {
    await this.removeMany({
      shiftId: new ObjectId(shiftId),
      status: ShiftBufferRequestStatus.Pending,
    }, {
      modifiedById: modifiedById,
      status: ShiftBufferRequestStatus.Rejected,
    });
  }

  async removeByShiftGroupId(shiftGroupId: string, modifiedById: ObjectId) {
    await this.removeMany({
      shiftGroupId,
      status: ShiftBufferRequestStatus.Pending,
    }, {
      modifiedById: modifiedById,
      status: ShiftBufferRequestStatus.Rejected,
    });
  }

  async removeByAssignmentId(assignmentId: string, modifiedById: ObjectId) {
    await this.removeMany({
      assignmentId: new ObjectId(assignmentId),
      status: ShiftBufferRequestStatus.Pending,
    }, {
      modifiedById: modifiedById,
      status: ShiftBufferRequestStatus.Rejected,
    });
  }

  async removeByEventId(eventId: string, modifiedById: ObjectId) {
    await this.removeMany({
      eventId: new ObjectId(eventId),
      status: ShiftBufferRequestStatus.Pending,
    }, {
      modifiedById: modifiedById,
      status: ShiftBufferRequestStatus.Rejected,
    });
  }
  
  async denyAllOpenShiftBufferRequests({
    shiftId,
    reason,
    ignoreIds,
    modifiedById,
  }: {shiftId: string, reason?: string, ignoreIds?: string[], modifiedById: ObjectId}) {
    await this.collection.updateMany({
      shiftId: new ObjectId(shiftId),
      status: ShiftBufferRequestStatus.Pending,
      ...(ignoreIds ? { _id: { $nin: ignoreIds.map((ignoreId) => new ObjectId(ignoreId)) } } : {}),
    }, {
      $set: {
        status: ShiftBufferRequestStatus.Rejected,
        reason: reason || 'Shift was assigned to someone else',
        modifiedById: modifiedById,
      },
    });
  }

  async updateByShiftGroupId(shiftGroupId: string, startTime: number, endTime: number, modifiedById: ObjectId) {
    await this.collection.updateMany({
      shiftGroupId,
    }, {
      $set: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        modifiedById: new ObjectId(modifiedById),
      },
    });
  }
};
