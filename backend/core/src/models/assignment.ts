import { Db } from 'mongodb';
import uniq from 'lodash.uniq';
import { Assignment, DocType } from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import logger from '../utils/logger';

export class AssignmentModel extends BaseModel<Assignment> {
  constructor(db: Db) {
    super(db, DocType.Assignment);
  }

  async linkShifts(shiftIds: string[], assignment: Assignment) {
    const currentShiftIds = assignment.shiftIds || [];
    const newIds = shiftIds.filter((id) => !currentShiftIds.includes(id));
    if (newIds.length > 0) {
      const shiftIds = uniq([...currentShiftIds, ...newIds]);
      await this.update({
        ...assignment,
        shiftIds,
      }, { skipMerge: true });
    }
  }

  async removeShifts(assignmentId: string, shiftIds: string[]) {
    const assignment = await this.get(assignmentId);
    if (assignment) {
      await this.update({
        ...assignment,
        shiftIds: (assignment.shiftIds || []).filter((sid) => !shiftIds.includes(sid as string)),
      } as any, { skipMerge: true });
    }
  }

  async removeAllByEventId(orgId: string, eventId: string) {
    const assignmentRes = await this.collection.deleteMany({
      orgId,
      eventId,
      docType: DocType.Assignment,
    });

    if (assignmentRes.deletedCount === 0) {
      logger.warn('No assignments removed', {
        orgId,
        eventId,
        docType: DocType.Assignment,
      });
    }
  }
};
