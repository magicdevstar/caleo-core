import { Collection, Db, ObjectId } from "mongodb";

export const analysisLotto58 = async (prodDb: Db) => {
  try {
    const ids = [
      new ObjectId('5f9b1b3b1f3b3b001f3b3b00'),
      new ObjectId('5f9b1b3b1f3b3b001f3b3b01'),
      new ObjectId('5f9b1b3b1f3b3b001f3b3b02'),
    ];
    const findId = new ObjectId('5f9b1b3b1f3b3b001f3b3b00');

    console.log('Found: ', ids.includes(findId));

    // let index = 0;
    // const results: any[] = [];
    // for await (const item of prodDb.collection('shiftLotteryRequests').aggregate([
    //   {
    //     $match:
    //       /**
    //        * query: The query in MQL.
    //        */
    //       {
    //         lotteryCounter: 58,
    //         status: "APPROVED"
    //       }
    //   },
    //   {
    //     $sort:
    //       /**
    //        * Provide any number of field/order pairs.
    //        */
    //       {
    //         updatedAt: -1
    //       }
    //   },
    //   {
    //     $group:
    //       /**
    //        * _id: The id of the group.
    //        * fieldN: The first field name.
    //        */
    //       {
    //         _id: "$shiftGroupId"
    //       }
    //   }
    // ])) {
    //   results.push({
    //     _id: item._id,
    //     index: index++,
    //   });
    // }
    // console.log(JSON.stringify(results, null, 2));
  } catch(error) {
    console.error('Failed to update shifts: ', error);
  }
}