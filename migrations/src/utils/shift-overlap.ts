import { Db } from "mongodb";

interface MongoEvent extends Omit<Event, 'id' | 'org'> {
  migrationId: number
}

export const shiftOverlap = async (devDb: Db, prodDb: Db) => {
  try {

    // const shiftIds = [
    //   "5a480e65-85f1-4836-ac1e-002fe69a5848",
    //   "69e1cb9a-2fc0-4863-829c-e7c5ff647e0e",
    //   "cfe37df5-008e-45f5-8dfe-646efebeffb9",
    //   "b6697bef-755a-43ec-be53-74db9688a940",
    //   "2dd80523-903a-49ba-afaa-4613ab6922c5",
    //   "9bf2cd7d-d5aa-4a3b-b521-f97e5b4c07c0",
    //   "02f89c87-373c-4201-aec9-af24cd475765",
    //   "611db504-a4a2-4ec8-a59e-50a65186a58c",
    //   "36801197-cbbc-4303-9a8a-4cbc803e15dd",
    //   "912fdade-6caa-415a-b3d5-e856b4210d54",
    //   "402228ba-4c0e-4ae5-a1fb-3cb53b8761df",
    //   "a5e3d489-a763-460d-b22c-bf7ddcf84680",
    //   "190b7837-a135-4d4e-92e5-58f435b2d6d5",
    //   "1bc81c64-9fec-4684-9a1f-6592a41fa88e",
    //   "adca2689-9bcb-4681-9416-85abb3aac1ac",
    //   "d0ef54b2-1c19-4130-8193-c6953d5f65cf",
    //   "f8fda0d3-9066-42b0-8a42-34e37537167c",
    //   "d335f4f1-b15f-436f-b993-95ce25462f5c",
    //   "4469c6b2-eaa2-403d-af23-e2e5f93514ba",
    //   "06db9abe-288a-4908-9f98-51f73206e48a",
    //   "77cce2c6-c301-48d7-9c52-74e461c7df78",
    //   "3b0938d0-8b85-4929-989e-2a91dbfe20fb",
    //   "7c51fb6a-9c67-4cca-87e2-6e3140042b2d",
    //   "703b6b7d-1a15-4d89-b309-af7b094812e9",
    //   "acc137a5-0f62-4adb-a2c8-2902401a0d55",
    //   "7097f26a-49a6-46db-9163-aafb534e5c88",
    //   "67ebb4da-839f-41d6-a2d1-05d511825449",
    //   "eb892ede-2066-43c6-b3be-c143b5ad15fb",
    //   "353b5301-1455-4fe9-a261-a3fb43efff81",
    //   "48b2ad2c-d1bd-4714-bf9d-c8a755e53516",
    //   "314ee518-896d-4168-80c0-892f6bde5774",
    //   "231765e0-6cab-4f56-a1b5-094f38de6d9e",
    //   "18dd6293-6d5b-4480-a4a7-9a464d91ef4b",
    //   "c471d9fc-a142-4b88-b4d4-33cceba06657",
    //   "a0a1ed5e-fc34-484f-98da-00387a648bec",
    //   "c1a1e275-f0ad-4479-9354-cafe9510f8cf",
    //   "8d649256-ebf3-41de-99a9-c3fa4e91dd63",
    //   "e10b5b1c-5806-4234-9ab7-0bc796521cdd",
    //   "846a18f4-42a3-461a-9f12-73580d0b1ca5",
    //   "9e572430-46d3-4884-9366-c524f675f1d8",
    //   "20aeb957-142b-45db-bca1-0705d1523bdb",
    //   "01c1da0a-fb27-4ce8-a37c-c236ed804283",
    //   "9def0d94-335d-481c-b4df-9faaf60e2138",
    //   "270f09b8-36fc-4dc5-8695-09b62571545e",
    //   "ab517b29-072e-4993-8c94-6a6ecb9caa93",
    //   "32754635-075b-4e94-b4e4-49ef7805d40f",
    //   "ceaa20c5-4953-4c91-91e4-dc713e915167",
    //   "3371944b-5688-43ae-9984-bd19ee17d73e",
    //   "69ed8e45-121e-49f1-980c-13e59094ecbe",
    //   "982d6423-3df9-43b9-9612-f39c705808ae",
    //   "e3f18acf-37f2-4a0e-b69d-020d465276fc",
    //   "d55050d8-32c7-456d-8eba-f573fb31e1be",
    //   "26a5c01b-9673-426e-8311-1d832fe86637",
    //   "6da4446b-44c1-422c-b9a3-86b184472cb9",
    //   "0d06a7b1-657b-4ce7-9973-3803947474b0",
    //   "cb1af488-6c73-49c9-a912-b46d51df7be9",
    //   "160eb803-aef6-4c56-b610-97b96ff24da4",
    //   "d7de2856-008b-4ac6-a401-bf068bdd4667",
    //   "29b63513-8690-4686-990b-40504e37147f",
    //   "257cc6d1-ea6c-44ac-b137-9f0087418551",
    //   "7bff7944-c803-449a-b141-de855c4ac978",
    //   "8960668c-ea45-4780-8dc5-1621539b28c8",
    //   "2864b90a-4719-4711-abb3-e125569b29cd",
    //   "a8bc49cd-42c2-4b87-9d89-1eb8496376a8",
    //   "28b41c6d-1465-4443-9550-753aa9ffa3e5",
    //   "e9c44a11-cd67-41cb-858e-5994a15b0cb9",
    //   "33bf249f-65ca-4d4a-b660-5108b8ceb291",
    //   "4223a67c-029f-46e4-807a-5ca8503d825f",
    //   "a4fef288-15cf-4782-8477-bd7addc9eb91",
    //   "71facb69-f891-4e24-9e61-d81bcfb9d07c",
    //   "d12eeedb-5c81-4e6d-8f17-eb9596762000",
    //   "f7356835-2063-44ff-86da-ba041a2bb410",
    //   "5be878ef-250a-40f4-b6a1-74ba3801e122",
    //   "481fcff4-7865-4ff2-9080-e1d4a9279343",
    //   "21b5b966-7495-44cb-92b5-be542b048784",
    //   "ea3d0e61-f233-4267-9adf-c66ac456eec7",
    //   "47aa86f8-1b7c-490a-acfd-62c07e141547",
    //   "9e3913c9-8329-4070-bf42-ef375195c3f7",
    //   "bfa321a4-ed64-4114-b3e3-9441948148c4",
    //   "5350a386-b58b-42b1-ad5d-27b3eb715bef",
    //   "e09d0abe-4534-43e0-af25-315e2835d2c6",
    //   "3643a960-2f6b-4911-861b-b9a5363fb945",
    //   "4ab1c312-a7b5-40b4-9c7f-6852edb39aaa"
    // ];
    // const shifts = await prodDb.collection('shifts').find({
    //   $and: [
    //     { shiftId: {$in: shiftIds} },
    //     { removedAt: { $exists: false } },
    //     {
    //       $or: [
    //         { userId: null },
    //         {
    //           userId: {
    //             $exists: false,
    //           },
    //         },
    //       ],
    //     },
    //     {
    //       $or: [
    //         { locked: false },
    //         {
    //           locked: {
    //             $exists: false,
    //           },
    //         },
    //       ],
    //     },
    //   ],
    // }).toArray();


    // const groupedByShiftId = shifts.reduce((acc: any, shift: any) => {  
    //   acc[shift.shiftId] = `https://lvmpd.caleopro.com/dashboard/admin/overtime/events/${shift.eventId}/assignment/${shift.assignmentId}/shifts/${shift.shiftId}`;
    //   return acc;
    // }, {} as any);
    // console.log(JSON.stringify(groupedByShiftId, null, 2));

    const events = await prodDb.collection('events').find({
      lotteryNumber: 2,
      removedAt: { $exists: false },
    }).toArray();

    const eventIds = events.map(({ _id }) => _id.toString());
    const shifts = await prodDb.collection('shifts').find({
      eventId: { $in: eventIds },
      userId: { $ne: null },
      removedAt: { $exists: false },
    }).toArray();

    const rankings = await prodDb.collection('shiftLotteryRequests').find({
      lotteryCounter: 0,
    }).toArray();

    const groupedByUserAndShiftGroup = rankings.reduce((acc: any, ranking: any) => {
      if (!acc[ranking.userId]) {
        acc[ranking.userId] = {};
      }
      acc[ranking.userId][ranking.shiftGroupId] = ranking;
      return acc;
    }, {} as any);

    const overlapMap: any = {};

    for(const shift of shifts) {
      const { _id, startTime, endTime, userId } = shift;

      // Skip found overlapping shifts
      if (overlapMap?.[userId]?.overlappingIds?.includes?.(_id.toString())) {
        continue;
      }

      const bufferOffset = 1000 * 60 * 15;

      const $or = [
        // Case 1: The interval completely covers the start date and end date
        // Ex. 👇
        //     S                E 
        //     |****************|
        //  S1                     E1
        //  |----------------------| 
        {
          $and: [
            { startTime: { $lte: ((startTime as any) - bufferOffset) } },
            { endTime: { $gte: ((endTime as any) + bufferOffset) } }
          ],
        },
        // Case 2: The interval is completely inside the start date and end date
        // Ex. 👇
        //     S                E 
        //     |****************|
        //       S2        E2
        //       |----------|
        {
          $and: [
            { startTime: { $gte: ((startTime as any) - bufferOffset) } },
            { endTime: { $lte: ((endTime as any) + bufferOffset) } }
          ],
        },
        // Case 3: The start date is outside the interval and the end date is inside the interval
        // Ex. 👇
        //     S                E 
        //     |****************|
        // S3          E3
        // |-----------|
        {
          $and: [
            { endTime: { $gte: ((startTime as any) - bufferOffset) } },
            { endTime: { $lte: ((endTime as any) + bufferOffset) } }
          ],
        },
        // Case 4: The start date is inside the interval and the end date is outside the interval
        //     S                E 
        //     |****************|
        //              S4           E4
        //              |-------------|
        {
          $and: [
            { startTime: { $gte: ((startTime as any) - bufferOffset) } },
            { startTime: { $lte: ((endTime as any) + bufferOffset) } }
          ],
        },
      ];

      const overlappingShifts = await prodDb.collection('shifts').find({
        userId,
        orgId: shift.orgId,
        removedAt: { $exists: false },
        _id: { $ne: shift._id },
        $or,
      }).toArray();

      if (overlappingShifts.length >= 1) {
        if (!overlapMap[userId]) {
          overlapMap[userId] = {overlappingIds: [], overlappingGroups: []};
        }
        const ids = overlappingShifts.map(({ _id }) => _id.toString());
        overlapMap[userId].overlappingIds.push(_id.toString(), ...ids);

        const shiftGroupIds = [shift.shiftId, ...overlappingShifts.map(({ shiftId }) => shiftId)];

        const rankings = shiftGroupIds.reduce((acc: any, shiftGroupId: any) => {
          if (groupedByUserAndShiftGroup[userId] && groupedByUserAndShiftGroup[userId][shiftGroupId]) {
            acc.push({
              shiftGroupId,
              order: groupedByUserAndShiftGroup[userId][shiftGroupId].order,
              createdAt: groupedByUserAndShiftGroup[userId][shiftGroupId].createdAt,
              _id: groupedByUserAndShiftGroup[userId][shiftGroupId]._id,
            });
          }
          return acc;
        }, [] as any);

        overlapMap[userId].overlappingGroups.push({
          overlaps: [shift, ...overlappingShifts],
          rankings,
        });
      }
    }

    // console.log(JSON.stringify(overlapMap, null, 2));
    let bulkLotteryWrite: any = [];
    let bulkShiftWrite: any = [];
    const unassignedShiftGroupIds = new Set();
    const unassignments: any = [];
    for(const userId of Object.keys(overlapMap)) {
      const data = overlapMap[userId];
      for(const group of data.overlappingGroups) {
        const { overlaps, rankings } = group;

        const rankingsByShiftId = rankings
          .sort((a: any, b: any) => a.createdAt - b.createdAt)
          .map((x: any, index: any) => ({
            ...x,
            order: index,
          }))
          .reduce((acc: any, ranking: any) => {
            acc[ranking.shiftGroupId] = ranking;
            return acc;
          }, {} as any);

        const keeper = overlaps.find(({ shiftId }: any) => rankingsByShiftId[shiftId]);
        if (!keeper) {
          continue;
        }
        const keepId = keeper._id;
        const removeIds = overlaps.filter(({ _id }: any) => keepId !== _id).map(({ _id, shiftId }: any) => {
          unassignedShiftGroupIds.add(shiftId);
          return _id;
        });

        group.rankings.forEach((ranking: any) => {
          if (ranking.shiftGroupId === keeper.shiftId) {
            ranking.keep = true;
          } else {
            bulkLotteryWrite.push({
              updateOne: {
                filter: { _id: ranking._id },
                update: { $set: { status: 'REJECTED' } },
              }
            });
          }
        });
        
        group.keepId = keepId;
        group.removeIds = removeIds;

        unassignments.push(...removeIds.map((id: any) => ({
          userId,
          id,
        })));
        bulkShiftWrite.push(...removeIds.map((id: any) => ({
          updateOne: {
            filter: { _id: id },
            update: { $unset: { userId } },
          },
        })));
      }
    }

    console.log(JSON.stringify(unassignments, null, 2));
    // const bulkLottery = await prodDb.collection('shiftLotteryRequests').bulkWrite(bulkLotteryWrite);
    console.log('bulkLottery', JSON.stringify(bulkLotteryWrite, null, 2));
    // const bulkShift = await prodDb.collection('shifts').bulkWrite(bulkShiftWrite);
    console.log('bulkShift', JSON.stringify(bulkShiftWrite, null, 2));

    console.log(JSON.stringify([...unassignedShiftGroupIds], null, 2));
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}