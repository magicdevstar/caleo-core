import { sortBy } from "lodash";
import { Db, ObjectId } from "mongodb";

export const lottoAnalysis = async (prodDb: Db, lotteryCounter: number) => {
  try {
    const results = await prodDb.collection('shiftLotteryRequests').find({
      lotteryCounter,
      status: 'PENDING'
    }).toArray();

    const groupings: Record<string, Record<string, any[]>> = {};

    for (const result of results) {
      const userId = result.userId.toString();
      if(!groupings[userId]) groupings[userId] = {} as Record<string, any[]>;
      if(!groupings[userId][`${result.order}`]) groupings[userId][`${result.order}`] = [];
      groupings[userId][`${result.order}`].push(result);
    }


    const allBulkOperations: any[] = [];
    const bulkOperations: Record<string, any[]> = {};
    for(const userId of Object.keys(groupings)) {
      const first = groupings[userId]['0'];
      if (first.length > 1) {
        let fullList: any[] = [];
        for (const key of Object.keys(groupings[userId])) {
          const originalSet = groupings[userId][key];
          const sorted = sortBy(originalSet, 'createdAt').reverse();
          fullList.push(...sorted);
        }
        bulkOperations[userId] = fullList.map((s, i) => ({
          updateOne: {
            filter: { _id: s._id },
            update: { $set: { order : i } }
          }
        }));
        allBulkOperations.push(...bulkOperations[userId]);
      }
    }

    // const firstKey = Object.keys(bulkOperations)[0];
    // const res = await prodDb.collection('shiftLotteryRequests').bulkWrite(allBulkOperations);

    // console.log(JSON.stringify(res, null, 2));
    // console.log(firstKey);
    console.log(JSON.stringify(bulkOperations, null, 2));
    console.log(allBulkOperations.length);
  } catch (error) {
    console.error(error);
  }
}