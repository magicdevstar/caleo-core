import { Db, ObjectId } from "mongodb";

export const removeOldShifts = async (prodDb: Db) => {
  try {
    const results = await prodDb.collection('shifts').aggregate([
      {
        $lookup:
          /**
           * from: The target collection.
           * localField: The local join field.
           * foreignField: The target join field.
           * as: The name for the results.
           * pipeline: Optional pipeline to run on the foreign collection.
           * let: Optional variables to use in the pipeline field stages.
           */
          {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "events"
          }
      },
      {
        $match:
          /**
           * query: The query in MQL.
           */
          {
            "events.0": {
              $exists: false
            }
          }
      }
    ]).project({
      eventId: 1
    }).toArray();

    const eventIds = results.map((result: any) => result.eventId.toString());
    const uniqueEventIds = [...new Set(eventIds)].map((id: string) => new ObjectId(id));
    console.log(uniqueEventIds);
    const result = await prodDb.collection('shifts').deleteMany({eventId: {$in: uniqueEventIds}});
    console.log(result);
  } catch(error) {
    console.error('Failed to migrate: ', error);
  }
};
