import { Collection, Db, ObjectId } from "mongodb";
import { mysql } from "./utils/mysql";
import { DocType, MemberSkill, Rank, SkillStatus } from "./utils/resolvers-types";

export interface OldMemberSkill {
  id: number
  user_id: number
  skill_id: number
  cert_id: any
  status: string
  expires_at: any
  created_at: Date
  status_reason: any
}


interface MongoMemberSkill extends Omit<MemberSkill, 'id' | 'imagePath' | 'skill'> {
  migrationId: number
}

const MemberStatusMap: Record<string, SkillStatus> = {
  'Approved': SkillStatus.Approved,
  'Denied': SkillStatus.Denied,
  'Pending': SkillStatus.Pending,
}

export const memberSkills = async (collection: Collection, db: Db) => {
  try {
    const bulk: any = [];
    const migrationIds = (await collection
      .find({ migrationId: { $exists: true } })
      .project({ migrationId: 1 })
      .toArray())
      .map(({ migrationId }) => migrationId);

    const skillMap = (await db
      .collection('skills')
      .find({})
      .project({ migrationId: 1, _id: 1 })
      .toArray()).reduce((acc, { migrationId, _id }) => {
        acc[migrationId] = _id.toString();
        return acc;
      }, {});
    const userMap = (await db
      .collection('users')
      .find({})
      .project({ migrationId: 1, _id: 1 })
      .toArray()).reduce((acc, { migrationId, _id }) => {
        acc[migrationId] = _id.toString();
        return acc;
      }, {});

    const userUpdates: any = {};

    for await (const qualification of mysql<OldMemberSkill>('qualification').stream()) {
      const foundMongo = migrationIds.includes(qualification.id);
      if (!foundMongo && skillMap[qualification.skill_id] && userMap[qualification.user_id]) {
        const item: MongoMemberSkill = {
          status: MemberStatusMap[qualification.status],
          skillId: skillMap[qualification.skill_id],
          userId: userMap[qualification.user_id],
          orgId: process.env.ORG_ID!,
          docType: DocType.MemberSkill,
          createdAt: qualification.created_at.getTime() as any,
          updatedAt: qualification.created_at.getTime() as any,
          migrationId: qualification.id,
        }

        if (!userUpdates[userMap[qualification.user_id]]) {
          userUpdates[userMap[qualification.user_id]] = [];
        }
        bulk.push(item);
      }
    }
    if (bulk.length > 0) {
      const res = await collection.insertMany(bulk);
      console.log('Member Skills bulk write: ', JSON.stringify(res, null, 2));

      const userSkills: any = {};
      Object.keys(res.insertedIds).forEach((index) => {
        const skillId = res.insertedIds[index as any];
        const { userId } = bulk[index];
        if (!userSkills[userId]) {
          userSkills[userId] = [];
        }
        userSkills[userId].push(skillId);
      });
      const userBulkUpdates: any = Object.keys(userSkills).map((userId) => ({
        updateOne: {
          filter: { _id: new ObjectId(userId) },
          update: {
            $push: {
              'member.memberSkillIds': {
                $each: userSkills[userId].map((thing: ObjectId) => thing.toString())
              }
            }
          },
        },
      }));

      if (userBulkUpdates.length > 0) {
        const userRes = await db.collection('users').bulkWrite(userBulkUpdates);
        console.log('User Member Skills bulk write: ', JSON.stringify(userRes, null, 2));
      }
    } 
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}