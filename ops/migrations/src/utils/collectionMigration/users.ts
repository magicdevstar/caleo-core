import { Collection, ObjectId } from "mongodb";

export const users = async (collection: Collection) => {
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
              ...(doc.modifiedById && {modifiedById: new ObjectId(doc.modifiedById)}),
              ...(doc.createdById && {createdById: new ObjectId(doc.createdById)}),
              ...(doc.member.orgId && {'member.orgId': new ObjectId(doc.member.orgId)}),
              ...(doc.member.rankId && {'member.rankId': new ObjectId(doc.member.rankId)}),
              ...(doc.member.memberSkillIds && {'member.memberSkillIds': (doc.member.memberSkillIds || []).map((i: string) => new ObjectId(i))}),
              ...(doc.member.inactivateUntil && {'member.inactivateUntil': new Date(doc.member.inactivateUntil)}),
              ...(doc.member.startDate && {'member.startDate': new Date(doc.member.startDate)}),
              ...(doc.member.tierUntil && {'member.tierUntil': new Date(doc.member.tierUntil)}),
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