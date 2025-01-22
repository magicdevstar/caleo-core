import { Db, ObjectId } from "mongodb";
import uniqeBy from 'lodash/uniqBy';
import { MemberTier } from "./resolvers-types";

export const analytics = async (prodDb: Db) => {
  try {

    const $or = [
      {
        "$and":[
          { "startTime": { $gte: (1705348800000 - 900000) } },
          { "endTime": { $lte: (1705374000000 + 900000) } }
        ],
      },
      {
        "$and":[
          { "endTime": { $gte: (1705348800000 - 900000) } },
          { "endTime": { $lte: (1705374000000 + 900000) } }
        ],
      },
      {
        "$and":[
          { "startTime": { $gte: (1705348800000 - 900000) } },
          { "startTime": { $lte: (1705374000000 + 900000) } }
        ],
      },
      {
        "$and":[
          { "startTime": { $lte: (1705348800000 + 900000) } },
          { "endTime": { $gte: (1705374000000 - 900000) } }
        ],
      },
    ]

    // const shifts = await prodDb.collection('shifts').find({
    //   userId: '65810eb96b4100cdebc8b3cf',
    //   $or,
    // }).toArray();

    console.log(JSON.stringify({
      userId: '65810eb96b4100cdebc8b3cf',
      $or,
    }));

    // const userIds = await prodDb.collection('users').find({'member.tierResetOnNextLottery': false, 'member.tier': 'TIER_1'}).project({'_id': 1}).toArray();
    // console.log(JSON.stringify(userIds));

    // const ranked = await prodDb.collection('shiftLotteryRequests').find({
    //   userId: { $in: userIds.map(({ _id }) => _id.toString()) },
    //   lotteryCounter: 2,
    // }).toArray();

    // const groupedByUserId = ranked.reduce((acc: any, { userId, lotteryCounter }: any) => {

    //   if (!acc[userId]) {
    //     acc[userId] = [];
    //   }

    //   acc[userId].push(lotteryCounter);

    //   return acc;
    // }, {});

    // console.log(Object.keys(groupedByUserId).length);
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}