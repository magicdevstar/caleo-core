import { Db, ObjectId } from 'mongodb';
import { ShiftBufferRequest, DocType, ShiftBufferRequestStatus } from '../__generated__/resolvers-types';
import { BaseModel } from './base';

export class ShiftBufferRequestModel extends BaseModel<ShiftBufferRequest> {
  constructor(db: Db) {
    super(db, DocType.ShiftBufferRequest);
  }

  async removeByShiftId(shiftId: string) {
    await this.collection.deleteOne({
      docType: DocType.ShiftBufferRequest,
      shiftId,
    });
  }

  async removeByShiftGroupId(shiftGroupId: string) {
    await this.collection.deleteOne({
      docType: DocType.ShiftBufferRequest,
      shiftGroupId,
    });
  }

  async removeByAssignmentId(assignmentId: string) {
    await this.collection.deleteOne({
      docType: DocType.ShiftBufferRequest,
      assignmentId,
    });
  }

  async removeByEventId(eventId: string) {
    await this.collection.deleteOne({
      docType: DocType.ShiftBufferRequest,
      eventId,
    });
  }
  
  async denyAllOpenShiftBufferRequests({
    shiftId,
    reason,
    ignoreIds
  }: {shiftId: string, reason?: string, ignoreIds?: string[]}) {
    await this.collection.updateMany({
      docType: DocType.ShiftBufferRequest,
      shiftId,
      status: ShiftBufferRequestStatus.Pending,
      ...(ignoreIds ? { _id: { $nin: ignoreIds.map((ignoreId) => new ObjectId(ignoreId)) } } : {}),
    }, {
      $set: {
        status: ShiftBufferRequestStatus.Rejected,
        reason: reason || 'Shift was assigned to someone else',
      },
    });
  }

  async updateByShiftGroupId(shiftGroupId: string, startTime: number, endTime: number) {
    await this.collection.updateMany({
      docType: DocType.ShiftBufferRequest,
      shiftGroupId,
    }, {
      $set: {
        startTime,
        endTime,
      },
    });
  }
};
