import { Db, ObjectId } from 'mongodb';
import { ShiftInterestRequest, DocType, UpsertShiftInterestRequest, ShiftInterestRequestStatus } from '../__generated__/resolvers-types';
import { BaseMongo } from './base.v2';
import DataLoader from 'dataloader';

export interface IShiftInterestRequest extends Omit<
  ShiftInterestRequest,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'userId' |
  'orgId' |
  'eventId' |
  'assignmentId' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  userId: ObjectId;
  orgId: ObjectId;
  eventId: ObjectId;

  modifiedById: ObjectId;
  assignmentId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export interface IUpsertShiftInterestRequest extends Omit<UpsertShiftInterestRequest, 'userId' | 'id'> {
  id?: string;
  userId: ObjectId;
  orgId: ObjectId;
  eventId: ObjectId;
  assignmentId: ObjectId;
  modifiedById: ObjectId;
  status?: ShiftInterestRequestStatus;
}

export class ShiftInterestRequestModel extends BaseMongo<IShiftInterestRequest> {
  public requestLoader = new DataLoader(async (keys: readonly {userId: string; orgId: string; shiftGroupId: string}[]) => {
    const userId = new ObjectId(keys[0].userId);
    const groupIds = keys.map((key) => key.shiftGroupId);
    const res = await this.collection.find({
      userId,
      shiftGroupId: {
        $in: groupIds,
      },
      removedAt: { $exists: false },
    }).toArray();

    return keys.map(({ shiftGroupId }) => res.find((item) => item.shiftGroupId === shiftGroupId));
  });

  constructor(db: Db) {
    super(db, DocType.ShiftInterestRequest, 'shiftInterestRequests');
  }
};
