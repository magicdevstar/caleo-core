import { Db } from 'mongodb';
import DataLoader from 'dataloader';
import { ShiftLotteryRequest, DocType, MemberTier } from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import { LotteryCounterModel } from './lotteryCounter';

export class ShiftLotteryRequestModel extends BaseModel<ShiftLotteryRequest> {
  public requestLoader = new DataLoader(async (keys: readonly {userId: string; orgId: string; shiftGroupId: string}[]) => {
    const { counter } = await this.lotteryCounter.get(keys[0].orgId);
    const userId = keys[0].userId;
    const groupIds = keys.map((key) => key.shiftGroupId);
    const res = await this.collection.find({
      userId,
      lotteryCounter: counter,
      shiftGroupId: {
        $in: groupIds,
      },
    }).toArray();

    return keys.map(({ shiftGroupId }) => res.find((item) => item.shiftGroupId === shiftGroupId));
  });

  constructor(db: Db, private lotteryCounter: LotteryCounterModel) {
    super(db, DocType.ShiftLotteryRequest, 'shiftLotteryRequests');
  }

  async removeByShiftGroupId(shiftGroupId: string) {
    await this.collection.deleteOne({
      shiftGroupId,
    });
  }

  async removeByAssignmentId(assignmentId: string) {
    await this.collection.deleteOne({
      assignmentId,
    });
  }

  async removeByEventId(eventId: string) {
    await this.collection.deleteOne({
      eventId,
    });
  }

  async requestsStagedForAssignment(shiftGroupId: string): Promise<{
    shiftGroupId: string;
    docType: string;
    order: number;
    userId: string;
    user: {
      id: string;
      member: {
        tier: MemberTier;
      };
    };
  }[]> {
    const pipeline = [
      {
        $match:
          {
            shiftGroupId,
          },
      },
      {
        $addFields:
          {
            userId: {
              $toObjectId: "$userId",
            },
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
            shiftGroupId: 1,
            docType: 1,
            order: 1,
            userId: 1,
            user: {
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

    return this.collection.aggregate(pipeline).toArray() as any;
  }
};
