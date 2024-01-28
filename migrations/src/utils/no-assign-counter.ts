import { Db, ObjectId } from "mongodb";

export const noAssignCounter = async (prodDb: Db) => {
  try {
    const LOTTERY_NUMBER = 4;
    const userMap: Record<string, string[]> = {};

    for await (const req of prodDb.collection('shiftLotteryRequests').find({
      lotteryCounter: LOTTERY_NUMBER,
      status: {$in: ['APPROVED', 'REJECTED']},
    }, {
      projection: {
        _id: 1,
        userId: 1,
        status: 1,
      }
    })) {
      if (!userMap[req.userId]) {
        userMap[req.userId] = [];
      }
      userMap[req.userId].push(req.status);
    }
    // console.log(JSON.stringify(userMap, null, 2));

    const notAssigned = Object.keys(userMap)
      .filter((userId) => !userMap[userId].includes('APPROVED'));

    const users = await prodDb.collection('users').find({
      _id: {$in: notAssigned.map((id) => new ObjectId(id))},
    }, {
      projection: {
        name: 1,
        'member.tier': 1,
      }
    }).toArray();

    // console.log(JSON.stringify(notAssigned, null, 2));
    console.log(JSON.stringify(users, null, 2));
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}