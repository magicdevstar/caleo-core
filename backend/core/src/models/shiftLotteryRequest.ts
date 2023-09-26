import { Db, ObjectId } from 'mongodb';
import { ShiftLotteryRequest, DocType, MemberTier } from '../__generated__/resolvers-types';
import { BaseModel } from './base';

export class ShiftLotteryRequestModel extends BaseModel<ShiftLotteryRequest> {
  constructor(db: Db) {
    super(db, DocType.ShiftLotteryRequest, 'shiftLotteryRequests');
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
            docType: "SHIFT_LOTTERY_REQUEST",
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
            from: "core",
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
