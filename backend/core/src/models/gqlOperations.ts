import { Db, ObjectId } from 'mongodb';
import { BaseMongo } from './base.v2';
import startOfDay from 'date-fns/startOfDay';
import { create } from 'domain';

export interface IOperation {
  _id?: ObjectId;
  id?: string;
  operationName: string;
  date: Date;
  count: number;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export class OperationModel extends BaseMongo<IOperation> {
  constructor(db: Db) {
    super(db, 'OPERATIONS' as any, 'operations');
  }

  async save(operationName?: string) {
    if (!operationName) {
      return;
    }
    const date = startOfDay(new Date());
    const operation = {
      operationName,
      date,
    };

    await this.collection.updateOne(operation, {
      $set: {
        ...operation,
        updatedAt: new Date(),
      },
      $inc: { count: 1 },
      $setOnInsert: {
        createdAt: new Date(),
      }
    }, {
      upsert: true,
    });
  }
};
