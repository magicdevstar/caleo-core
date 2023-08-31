import { Db } from 'mongodb';
import { DocType, Shift } from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import logger from '../utils/logger';

export class ShiftModel extends BaseModel<Shift> {
  constructor(db: Db) {
    super(db, DocType.Shift);
  }

  async removeAllByEventId(orgId: string, eventId: string): Promise<void> {
    const shiftRes = await this.collection.deleteMany({
      orgId,
      eventId,
      docType: DocType.Shift,
    });

    if (shiftRes.deletedCount === 0) {
      logger.warn('No shifts removed', {
        orgId,
        eventId,
        docType: DocType.Shift,
      });
    }
  }

  async removeAllByAssignmentId(orgId: string, assignmentId: string): Promise<void> {
    const shiftRes = await this.collection.deleteMany({
      orgId,
      docType: DocType.Shift,
      assignmentId,
    });
    if (shiftRes.deletedCount === 0) {
      logger.warn('No shifts removed', {
        orgId,
        docType: DocType.Shift,
        assignmentId,
      });
    }
  }

  async getByShiftId(shiftId: string): Promise<Shift | null> {
    return this.findOne({
      shiftId,
    });
  }
};
