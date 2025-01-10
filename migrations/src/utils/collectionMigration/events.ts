import { Collection, ObjectId } from "mongodb";

export const events = async (collection: Collection) => {
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

              ...(doc.venueId && { venueId: new ObjectId(doc.venueId) }),
              ...(doc.assignmentIds && { assignmentIds: doc.assignmentIds.map((id: string) => new ObjectId(id)) }),
              ...(doc.createdById && { createdById: new ObjectId(doc.createdById) }),
              ...(doc.requestDetails && {
                requestDetails: {
                  ...doc.requestDetails,
                  ...(doc.startTime && { startTime: new Date(doc.startTime) }),
                  ...(doc.endTime && { endTime: new Date(doc.endTime) }),
                },
              }),
              ...(doc.startTime && { startTime: new Date(doc.startTime) }),
              ...(doc.endTime && { endTime: new Date(doc.endTime) }),
              ...(doc.scheduledInterestList && { scheduledInterestList: new Date(doc.scheduledInterestList) }),
              ...(doc.scheduledCloseInterestList && { scheduledCloseInterestList: new Date(doc.scheduledCloseInterestList) }),
              ...(doc.scheduledFirstComeFirstServe && { scheduledFirstComeFirstServe: new Date(doc.scheduledFirstComeFirstServe) }),
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
