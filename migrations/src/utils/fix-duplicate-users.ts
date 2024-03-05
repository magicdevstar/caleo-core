import { Collection, Db, ObjectId } from "mongodb";

export const fixDupUsers = async (prodDb: Db) => {
  try {
    const idsToRemove: any[] = [];
    for await (const user of prodDb.collection('users').find({
      'member.orgId': null,
    })) {
      const foundMatchingUser = await prodDb.collection('users').find({ cognitoId: user.cognitoId }).toArray();

      const nullOrgUser = foundMatchingUser.find((u) => u.member.orgId === null);

      if (nullOrgUser) {
        idsToRemove.push(nullOrgUser._id);
      }
    }
    console.log('IDs to remove: ', idsToRemove.length);
    // const res = await prodDb.collection('users').deleteMany({ _id: { $in: idsToRemove } });
    // console.log(JSON.stringify(res, null, 2));
  } catch(error) {
    console.error('Failed to dedupe users: ', error);
  }
}