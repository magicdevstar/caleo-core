import { Collection, Db, ObjectId } from "mongodb";

interface MongoEvent extends Omit<Event, 'id' | 'org'> {
  migrationId: number
}

export const adjustEventTimes = async (collection: Collection, map: Record<string, {startTime: number; endTime: number;}>) => {
  const eventUpdates: any = [];

  Object.keys(map).forEach((key) => {
    const { startTime, endTime } = map[key];
    eventUpdates.push({
      updateOne: {
        filter: { _id: new ObjectId(key) },
        update: {
          $set: {
            startTime,
            endTime,
          },
        },
      },
    });
  });

  if (eventUpdates.length > 0) {
    const res = await collection.bulkWrite(eventUpdates);
    console.log('Events bulk write: ', JSON.stringify(res, null, 2));
  }
}

export const fixMe = async (devDb: Db, prodDb: Db) => {
  try {
    const bulk: any = [];
    
    let count = 0;
    const prodRequests = await prodDb.collection('shiftLotteryRequests').find({
      migrationId: { $exists: true },
      lotteryCounter: 0
    }).toArray();

    const migrationIds = prodRequests.map(({ migrationId }) => migrationId);
    console.log('Count: ', migrationIds.length);

    const foundItems = await devDb.collection('shiftLotteryRequests').find({
      migrationId: { $in: migrationIds },
    }).toArray();
    const mappedMigratedRequests: any = foundItems.reduce((acc, item) => {
      acc[item.migrationId] = item;
      return acc;
    }, {} as any);
    console.log(foundItems.length);

    // Update order, status, lotteryCounter and updatedAt
    const updates: any = prodRequests.map((item) => {
      const migratedItem = mappedMigratedRequests[item.migrationId];
      if (!migratedItem) {
        console.log('Not found: ', item.migrationId);
        return;
      }
      const { order, status, lotteryCounter, updatedAt } = migratedItem;
      return {
        updateOne: {
          filter: { _id: item._id },
          update: {
            $set: {
              order,
              status,
              lotteryCounter,
              updatedAt,
            },
          },
        },
      };
    });
    const res = await prodDb.collection('shiftLotteryRequests').bulkWrite(updates);

    console.log(JSON.stringify(res, null, 2));
    
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}