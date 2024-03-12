import { Collection, Db, ObjectId } from "mongodb";

const MAX_DOCUMENTS = 1000;

export const shiftRefMigration = async (devDb: Db) => {
  try {
    const shiftCollection = devDb.collection('shifts');
    const pipeline = [
      {
        $match: {
          migrationId: {
            $exists: false,
          },
        },
      },
      {
        $group: {
          _id: '$eventId',
          shifts: { $push: "$$ROOT" }
        },
      },
    ];

    let bulkUpdates: any[] = [];

    const updateBulk = async () => {
      if (bulkUpdates.length !== 0) {
        const res = await shiftCollection.bulkWrite(bulkUpdates);
        if (res.modifiedCount !== bulkUpdates.length) {
          console.log(JSON.stringify(res, null, 2));
        }
        bulkUpdates = [];
      }
    }

    for await(const { _id, shifts } of shiftCollection.aggregate(pipeline)) {
      let shiftRef = 0;
      const changeIds: Record<string, { oldRef: number, newRef: number; }> = {};

      const sortedShifts = shifts.sort((a: any, b: any) => a.createdAt - b.createdAt);

      sortedShifts.forEach((shift: any) => {
        const key = `${shift.shiftId}:${shift.refNumber}`;
        if (!changeIds[key]) {
          shiftRef += 1;
          changeIds[key] = {
            oldRef: shift.refNumber,
            newRef: shiftRef,
          };
        }
        bulkUpdates.push({
          updateOne: {
            filter: { _id: shift._id },
            update: {
              $set: {
                refNumber: changeIds[key].newRef,
              },
            },
          }
        });
      });

      if (bulkUpdates.length > MAX_DOCUMENTS) {
        await updateBulk();
      }
      // console.log('Shifts: ', JSON.stringify(sortedShifts, null, 2));
    }
    await updateBulk();
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}