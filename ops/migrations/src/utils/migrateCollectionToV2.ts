import { Collection, ObjectId } from "mongodb";

export const migrateCollectionToV2 = async (collection: Collection) => {
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

              // Assignments
              // eventId: new ObjectId(doc.eventId),
              // ...(doc.requiredSkillIds && { requiredSkillIds: doc.requiredSkillIds.map((id: string) => new ObjectId(id)) }),
              // ...(doc.rankIds && { rankIds: doc.rankIds.map((id: string) => new ObjectId(id)) }),
              // ...(doc.shiftIds && { shiftIds: doc.shiftIds.map((id: string) => new ObjectId(id)) }),

              // Venues

              // Skills
              // ...(doc.rankOnlyIds && { rankOnlyIds: doc.rankOnlyIds.map((id: string) => new ObjectId(id)) }),

              // Member skills
              // ...(doc.userId && { userId: new ObjectId(doc.userId) }),
              // ...(doc.skillId && { skillId: new ObjectId(doc.skillId) }),

              // Ranks

              // ShiftBufferRequests
              // ...(doc.shiftId && { shiftId: new ObjectId(doc.shiftId) }),
              // ...(doc.eventId && { eventId: new ObjectId(doc.eventId) }),
              // ...(doc.assignmentId && { assignmentId: new ObjectId(doc.assignmentId) }),
              // ...(doc.startTime && { startTime: new Date(doc.startTime) }),
              // ...(doc.endTime && { endTime: new Date(doc.endTime) }),
              // ...(doc.userId && { userId: new ObjectId(doc.userId) }),

              // SiteLock

              // lotteryCounter
              // start: new Date(doc.start),
              // end: new Date(doc.end),

              // memberNotifications
              notificationId: new ObjectId(doc.notificationId),
              userId: new ObjectId(doc.userId),
              lastSeen: new Date(doc.lastSeen),
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