import { Db } from 'mongodb';
import { ShiftLotteryRequest, DocType } from '../__generated__/resolvers-types';
import { BaseModel } from './base';

export class ShiftLotteryRequestModel extends BaseModel<ShiftLotteryRequest> {
  constructor(db: Db) {
    super(db, DocType.ShiftLotteryRequest);
  }

  async removeByShiftGroupId(shiftGroupId: string) {
    await this.collection.deleteOne({
      docType: DocType.ShiftLotteryRequest,
      shiftGroupId,
    });
  }

  async removeByAssignmentId(assignmentId: string) {
    await this.collection.deleteOne({
      docType: DocType.ShiftLotteryRequest,
      assignmentId,
    });
  }

  async removeByEventId(eventId: string) {
    await this.collection.deleteOne({
      docType: DocType.ShiftLotteryRequest,
      eventId,
    });
  }
};
