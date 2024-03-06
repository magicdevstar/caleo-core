import { Collection, Db, ObjectId } from "mongodb";

export const lottoAnalytics = async (prodDb: Db) => {
  try {
    const userAnalytics: any = {};

    const lotteryCounter = 10;
    const orgId = '64cd5e262c436093a2b7e680';

    for await (const { total, requests } of prodDb.collection('shiftLotteryRequests').aggregate([
      {
        $match: {
          lotteryCounter,
          orgId,
          status: {$in: ['REJECTED', 'APPROVED']}
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
    ])) {
      requests.forEach((request: any) => {
        if (!userAnalytics[request.userId]) {
          userAnalytics[request.userId] = {
            total: 0,
            accepted: 0,
            rejected: 0,
            requests: [],
          };
        }
        userAnalytics[request.userId].total++;
        userAnalytics[request.userId].requests.push({
          shiftLottoRequestId: request._id,
          event: request.eventId,
          shift: request.shiftId,
          assignmentId: request.assignmentId,
          shiftGroupId: request.shiftGroupId,
          status: request.status,
          order: request.order,
          totalRequests: total,
        });
        if (request.status === 'APPROVED') {
          userAnalytics[request.userId].accepted++;
        } else {
          userAnalytics[request.userId].rejected++;
        }
      });
    }

    console.log('User Analytics: ', JSON.stringify(userAnalytics, null, 2));
  } catch(error) {
    console.error('Failed to dedupe users: ', error);
  }
}
