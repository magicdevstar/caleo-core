import { Collection, ObjectId } from "mongodb";

export const assignments = async (collection: Collection) => {
  try {
    let batchUpdates: any[] = [];

    const sendBatchUpdates = async (force = false) => {
      if (batchUpdates.length >= 10000 || (force && batchUpdates.length > 0)) {
        await collection.bulkWrite(batchUpdates);
        batchUpdates = [];
      }
    };

    for await (const doc of collection.find()) {
      const update = {
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              ...(doc.createdAt && {createdAt: new Date(doc.createdAt)}),
              ...(doc.updatedAt && {updatedAt: new Date(doc.updatedAt)}),
              ...(doc.removedAt && {removedAt: new Date(doc.removedAt)}),
              ...(doc.orgId && {orgId: new ObjectId(doc.orgId)}),
              ...(doc.modifiedById && {modifiedById: new ObjectId(doc.modifiedById)}),
              ...(doc.createdById && {createdById: new ObjectId(doc.createdById)}),
              eventId: new ObjectId(doc.eventId),
              ...(doc.requiredSkillIds && { requiredSkillIds: doc.requiredSkillIds.map((id: string) => new ObjectId(id)) }),
              ...(doc.rankIds && { rankIds: doc.rankIds.map((id: string) => new ObjectId(id)) }),
              ...(doc.shiftIds && { shiftIds: doc.shiftIds.map((id: string) => new ObjectId(id)) }),
            }
          }
        }
      };
      batchUpdates.push(update);
      await sendBatchUpdates();
    }
    await sendBatchUpdates(true);
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}
