import DataLoader from "dataloader";
import { Collection, Db, ObjectId } from "mongodb";
import { DocType, ShiftLotteryRequestStatus, LottoAnalytics } from "../__generated__/resolvers-types";
import logger from "../utils/logger";

interface CreateUserAnalytics extends Omit<LottoAnalytics, 'id' | 'userId' | 'createdAt'> {
  userId: ObjectId;
  createdAt: Date;
}

export interface ILottoAnalytics extends Omit<LottoAnalytics, 'id' | 'userId' | 'createdAt'> {
  _id: ObjectId;
  userId: ObjectId;
  createdAt: Date;
}

export class UserAnalyticsModel {
  collection: Collection;
  lottoRequestsCollection: Collection;
  typeName: string = '';

  public loader = new DataLoader(async (keys: readonly ObjectId[]) => {
    const res = await this.collection.find({_id: {$in: keys}}).toArray();
    return keys.map((key) => res.find((item: any) => item._id === key));
  });

  constructor(db: Db) {
    this.collection = db.collection('lottoAnalytics');
    this.lottoRequestsCollection = db.collection('shiftLotteryRequests');
    const docType = DocType.UserAnalytics;
    this.typeName = docType.charAt(0).toUpperCase() + docType.slice(1).toLowerCase();
  }

  async createPostLotteryAnalytics({
    lotteryCounter,
    orgId
  }: {
    lotteryCounter: number;
    orgId: string;
  }) {
    const userAnalytics: Record<string, CreateUserAnalytics> = {};

    const pipeline = [
      {
        $match: {
          lotteryCounter,
          orgId,
          status: {
            $in: [
              ShiftLotteryRequestStatus.Approved,
              ShiftLotteryRequestStatus.Rejected
            ],
          }
        }
      },
      {
        $group: {
          _id: '$shiftGroupId',
          total: {
            $count: {}
          },
          requests: {
            $push: "$$ROOT"
          }
        }
      }
    ];

    let totalShifts = 0;

    for await (const { total, requests } of this.lottoRequestsCollection.aggregate(pipeline)) {
      totalShifts += 1;
      requests.forEach((request: any) => {
        let analytics: CreateUserAnalytics = userAnalytics[request.userId];
        if (!userAnalytics[request.userId]) {
          analytics = {
            userId: new ObjectId(request.userId),
            totalShifts: 0,
            lotteryCounter,
            createdAt: new Date(),
            total: 0,
            approved: 0,
            rejected: 0,
            requests: [],
          };
          userAnalytics[request.userId] = analytics;
        }
        userAnalytics[request.userId].total += 1;
        userAnalytics[request.userId].requests!.push({
          id: request._id,
          eventId: request.eventId,
          assignmentId: request.assignmentId,
          shiftGroupId: request.shiftGroupId,
          status: request.status,
          order: request.order,
          totalRequests: total,
        });
        if (request.status === ShiftLotteryRequestStatus.Approved) {
          userAnalytics[request.userId].approved += 1;
        } else {
          userAnalytics[request.userId].rejected += 1;
        }
      });
    }
    logger.info('User Analytics', { userAnalytics });
    if (Object.values(userAnalytics).length > 0) {
      const res = await this.collection.insertMany(Object.values(userAnalytics).map((analytics) => ({
        ...analytics,
        totalShifts,
      })));
      logger.info('Written analytics response', { res });
    }

  }

  getUserLottoAnalytics({
    userId,
    lotteryCounter,
  }: {
    userId: string;
    lotteryCounter: number;
  }) {
    return this.collection.findOne({
      userId: new ObjectId(userId),
      lotteryCounter,
    }) as unknown as ILottoAnalytics | null;
  }
}