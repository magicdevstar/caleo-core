import { Db, ObjectId } from 'mongodb';
import { ShiftInterestRequest, DocType, UpsertShiftInterestRequest, ShiftInterestRequestStatus, MemberStatus } from '../__generated__/resolvers-types';
import { BaseMongo } from './base.v2';
import DataLoader from 'dataloader';
import { IUser } from '../types/common';

export interface IShiftInterestRequest extends Omit<
  ShiftInterestRequest,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'assignedShift' |
  'userId' |
  'user' |
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
  assignedShiftId?: ObjectId;

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
  assignedShiftId?: ObjectId;
  status?: ShiftInterestRequestStatus;
}

export interface IStagedShiftInterestRequest extends IShiftInterestRequest {
  user: IUser;
  totalHours: number;
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

  async getExistingRequest(userId: string, shiftGroupId: string): Promise<IShiftInterestRequest | null> {
    const userObjectId = new ObjectId(userId);
    return this.collection.findOne<IShiftInterestRequest>({
      userId: userObjectId,
      shiftGroupId,
      removedAt: { $exists: false },
    });
  }

  async markAllAsApproved(ids: ObjectId[]) {
    return this.collection.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          status: ShiftInterestRequestStatus.Approved,
          updatedAt: new Date(),
        }
      }
    );
  }

  async requestsStagedForAssignment(
    shiftGroupId: string
  ): Promise<IStagedShiftInterestRequest[]> {
    const pipeline = [
      {
        $match: {
          shiftGroupId,
          status: ShiftInterestRequestStatus.Pending,
          removedAt: { $exists: false },
        },
      },
      {
        $lookup:
          {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
      },
      {
        $addFields:
          {
            user: {
              $arrayElemAt: ["$user", 0],
            },
          },
      },
      {
        $match: {
          'user.removedAt': { $exists: false },
          'user.member.status': MemberStatus.Active,
        },
      },
      {
        $sort:
          {
            "user.member.tier": 1,
          },
      },
      {
        $addFields:
          {
            'user.id': {
              $toString: "$user._id",
            },
          },
      },
      {
        $project:
          {
            _id: 1,
            shiftGroupId: 1,
            docType: 1,
            order: 1,
            userId: 1,
            lotteryCounter: 1,
            user: {
              _id: 1,
              id: 1,
              member: {
                rankId: 1,
                memberSkillIds: 1,
                memberEquipmentIds: 1,
                tenor: 1,
                tier: 1,
                availability: 1,
              },
            },
          },
      },
    ];

    return this.collection.aggregate<IStagedShiftInterestRequest>(pipeline).toArray();
  }
};
