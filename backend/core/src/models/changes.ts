import { Db, ObjectId } from 'mongodb';
import { BaseMongo } from './base.v2';
import { IAssignmentUpdates, IEventUpdates, IShiftUpdates } from '../types/notifications';

export enum ChangeType {
  EVENT = 'event',
  ASSIGNMENT = 'assignment',
  SHIFT = 'shift',
};

export interface IChanges {
  _id: ObjectId;
  id: string;
  orgId: ObjectId;

  // Type of change, e.g., event or assignment or shift
  type: ChangeType;
  // The _id of the entity that was changed, e.g., eventId or assignmentId or shiftId
  entityId: ObjectId | string;

  // This will be the start of the day of the change
  // For example, if the change was made on 2023-10-01T15:30:00Z,
  // this will be stored as 2023-10-01T00:00:00Z
  // This is useful for aggregating changes by day
  changeDate: Date;

  // The changes made to the event or assignment
  changes: IEventUpdates | IAssignmentUpdates | IShiftUpdates;
  
  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
};

export class ChangesModel extends BaseMongo<IChanges> {
  constructor(db: Db) {
    super(db, 'CHANGES' as any, 'changes');
  }

  async upsertForDay({
    type,
    entityId,
    orgId,
    changeDate,
    changes,
  }: {
    type: ChangeType;
    entityId: ObjectId | string;
    orgId: ObjectId;
    changeDate: Date;
    changes: IEventUpdates | IAssignmentUpdates | IShiftUpdates;
  }) {
    const setChanges = Object.keys(changes).reduce((acc, key) => {
      const value = changes[key];
      return {
        ...acc,
        [`changes.${key}`]: value,
      };
    }, {} as Record<string, any>);

    await this.collection.updateOne({
      type,
      entityId,
      changeDate,
      orgId,
    }, {
      $set: {
        ...setChanges,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    }, {
      upsert: true,
    });
  }
};
