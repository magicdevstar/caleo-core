import { Db, ObjectId } from 'mongodb';
import { DocType } from '../../__generated__/resolvers-types';
import { BaseMongo } from '../base.v2';
import { IEventUserAction } from './eventUserAction.entity';

export class EventUserActionRepo extends BaseMongo<IEventUserAction> {
  constructor(db: Db) {
    super(db, DocType.EventUserAction, 'eventUserActions');
  }

  async upsertAction({
    userId,
    eventId,
    key,
    value,
  }: {
    userId: ObjectId;
    eventId: ObjectId;
    key: 'shiftGroupId' | 'incidentFormId';
    value: ObjectId | string;
  }): Promise<void> {
    const now = new Date();
    const filter = {
      userId,
      eventId,
      [key]: value,
    };
    const update = {
      $setOnInsert: {
        createdAt: now,
      },
      $set: {
        updatedAt: now,
      },
    };
    await this.collection.updateOne(filter, update, { upsert: true });
  }
};
