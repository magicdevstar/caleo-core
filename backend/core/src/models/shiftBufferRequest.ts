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

const lambda = new LambdaClient({});

export class ShiftBufferRequestModel extends BaseModel<ShiftBufferRequest> {
  constructor(db: Db) {
    super(db, DocType.ShiftBufferRequest, 'shiftBufferRequests');
  }

  async updateWithNotification({
    request,
    shift,
    user,
    organization,
  }: {
    request: ShiftBufferRequest;
    shift: Shift;
    user: User;
    organization: Organization;
  }) {
    await this.update(request, { skipMerge: true });

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
    shiftBufferShift: Shift;
    shift: Shift;
    user: User;
    organization: Organization;
  }) {
    const createdShiftBuffer = await this.create<ShiftBufferRequest>({
      shiftId: shift.id,
      shiftGroupId: shift.shiftId,
      eventId: shift.eventId,
      startTime: shift.startTime,
      endTime: shift.endTime,
      shiftBufferShiftId: shiftBufferRequest.shiftBufferShiftId,
      status: ShiftBufferRequestStatus.Pending,
      assignmentId: shift.assignmentId,
      note: shiftBufferRequest.note,
      orgId: shift.orgId,
      userId: user?.id!,
      createdById: user?.id!,
      modifiedById: user?.id!,
    } as any);

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

  async removeByShiftId(shiftId: string, modifiedById: string) {
    await this.removeMany({
      shiftId,
    }, {
      modifiedById,
    });
  }

  async removeByShiftGroupId(shiftGroupId: string, modifiedById: string) {
    await this.removeMany({
      shiftGroupId,
    }, {
      modifiedById,
    });
  }

  async removeByAssignmentId(assignmentId: string, modifiedById: string) {
    await this.removeMany({
      assignmentId,
    }, {
      modifiedById
    });
  }

  async removeByEventId(eventId: string, modifiedById: string) {
    await this.removeMany({
      eventId,
    }, {
      modifiedById,
    });
  }
  
  async denyAllOpenShiftBufferRequests({
    shiftId,
    reason,
    ignoreIds,
    modifiedById,
  }: {shiftId: string, reason?: string, ignoreIds?: string[], modifiedById: string}) {
    await this.collection.updateMany({
      shiftId,
      status: ShiftBufferRequestStatus.Pending,
      ...(ignoreIds ? { _id: { $nin: ignoreIds.map((ignoreId) => new ObjectId(ignoreId)) } } : {}),
    }, {
      $set: {
        status: ShiftBufferRequestStatus.Rejected,
        reason: reason || 'Shift was assigned to someone else',
        modifiedById,
      },
    });
  }

  async updateByShiftGroupId(shiftGroupId: string, startTime: number, endTime: number, modifiedById: string) {
    await this.collection.updateMany({
      shiftGroupId,
    }, {
      $set: {
        startTime,
        endTime,
        modifiedById,
      },
    });
  }
};
