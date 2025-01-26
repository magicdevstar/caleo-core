import { Db, ObjectId } from 'mongodb';
import DataLoader from 'dataloader';
import { ShiftLotteryRequest, DocType, MemberTier, ShiftLotteryRequestStatus, MemberStatus, UserAvailability } from '../__generated__/resolvers-types';
import { LotteryCounterModel } from './lotteryCounter';
import { BaseMongo } from './base.v2';

export interface IShiftLotteryRequest extends Omit<
  ShiftLotteryRequest,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'orgId' |
  'org' |
  'assignmentId' |
  'assignment' |
  'eventId' |
  'event' |
  'shiftGroupId' |
  'shift' |
  'userId' |
  'user' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  orgId: ObjectId;
  modifiedById: ObjectId;
  assignmentId: ObjectId;
  eventId: ObjectId;
  shiftGroupId: string;
  userId: ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
  removedAt?: Date;
}

export interface IStagedShiftLotteryRequest {
  _id: ObjectId;
  shiftGroupId: string;
  docType: string;
  order: number;
  userId: string;
  lotteryCounter: number;
  user: {
    _id: ObjectId;
    id: string;
    member: {
      tier: MemberTier;
      memberSkillIds: string[];
      rankId: string;
      availability: any;
    };
  };
};

export class ShiftLotteryRequestModel extends BaseMongo<IShiftLotteryRequest> {
  public requestLoader = new DataLoader(async (keys: readonly {userId: string; orgId: string; shiftGroupId: string}[]) => {
    const { counter } = await this.lotteryCounter.get(new ObjectId(keys[0].orgId));
    const userId = keys[0].userId;
    const groupIds = keys.map((key) => key.shiftGroupId);
    const res = await this.collection.find({
      userId: new ObjectId(userId),
      lotteryCounter: counter,
      shiftGroupId: {
        $in: groupIds,
      },
      removedAt: { $exists: false },
    }).toArray();

    return keys.map(({ shiftGroupId }) => res.find((item) => item.shiftGroupId === shiftGroupId));
  });

  constructor(db: Db, private lotteryCounter: LotteryCounterModel) {
    super(db, DocType.ShiftLotteryRequest, 'shiftLotteryRequests');
  }

  async removeByShiftGroupId(shiftGroupId: string, modifiedById: ObjectId) {
    await this.removeMany({
      shiftGroupId,
      status: ShiftLotteryRequestStatus.Pending,
    }, {
      status: ShiftLotteryRequestStatus.Removed,
      modifiedById: modifiedById,
    });
  }

  async removeByAssignmentId(assignmentId: string, modifiedById: ObjectId) {
    await this.removeMany({
      assignmentId: new ObjectId(assignmentId),
      status: ShiftLotteryRequestStatus.Pending,
    }, {
      status: ShiftLotteryRequestStatus.Removed,
      modifiedById: modifiedById,
    });
  }

  async removeByEventId(eventId: string, modifiedById: ObjectId) {
    await this.removeMany({
      eventId: new ObjectId(eventId),
      status: ShiftLotteryRequestStatus.Pending,
    }, {
      status: ShiftLotteryRequestStatus.Removed,
      modifiedById: modifiedById,
    });
  }

  async requestsStagedForAssignment(shiftGroupId: string, reRun: boolean = false): Promise<IStagedShiftLotteryRequest[]> {
    let match: any = {
      shiftGroupId,
      removedAt: { $exists: false },
    };
    if (reRun) {
      match = {
        shiftGroupId,
        status: {$nin: [ShiftLotteryRequestStatus.Approved, ShiftLotteryRequestStatus.Removed]},
      };
    }
    const pipeline = [
      {
        $match: match,
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
            order: 1,
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
                tier: 1,
                availability: 1,
              },
            },
          },
      },
    ];

    return this.collection.aggregate(JSON.parse(JSON.stringify(pipeline))).toArray() as any;
  }

  async highestOrderNumber(lotteryCounter: number, userId: string) {
    const res = await this.collection.find({
      lotteryCounter,
      userId: new ObjectId(userId),
      removedAt: { $exists: false },
    }).sort({ order: -1 }).limit(1).toArray();
    return res[0] ? res[0].order : -1;
  }

  async reorderShifts(lotteryCounter: number, userId: string, excludeId: string) {
    const res = await this.collection.find({
      lotteryCounter,
      userId: new ObjectId(userId),
      removedAt: { $exists: false },
    }).project({ _id: 1, order: 1 }).sort({ order: 1 }).toArray();

    if (res && res.length) {
      const bulkUpdate = res
        .filter((item) => item._id.toString() !== excludeId)
        .map((item, index) => ({
          updateOne: {
            filter: { _id: item._id },
            update: { $set: { order: index } },
          },
        }));
      await this.collection.bulkWrite(bulkUpdate);
    }
  }
};
