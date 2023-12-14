import { mysql } from "./utils/mysql";
import { DocType, Rank, Skill } from "./utils/resolvers-types";
import { Collection, Db } from "mongodb";

export interface OldSkill {
  id: number
  name: string
  is_active: number
  requires_cert: number
  requires_admin_approval: number
  created_at: string
  modified_at: string
}


interface MongoSkill extends Omit<Omit<Skill, 'id'>, 'org'> {
  migrationId: number
}

export const skills = async (collection: Collection, db: Db) => {
  try {
    const bulk: any = [];
    const migrationIds = (await collection
      .find({ migrationId: { $exists: true } })
      .project({ migrationId: 1 })
      .toArray())
      .map(({ migrationId }) => migrationId);

    const rankIdMap = (await db
      .collection('ranks')
      .find({})
      .project({ migrationId: 1, _id: 1 })
      .toArray())
      .reduce((acc, { migrationId, _id }) => {
        acc[migrationId] = _id;
        return acc;
      }, {});

    for await (const skill of mysql<OldSkill>('skill').stream()) {
      const foundMongo = migrationIds.includes(skill.id);
      if (!foundMongo) {
        const restrictionList = await mysql('skill_restriction');
        const rankRestrictions = restrictionList
          .filter(({ skill_id }: any) => skill_id === skill.id)
          .map(({ rank_id }: any) => rankIdMap[rank_id].toString());
        const item = {
          name: skill.name,
          active: skill.is_active === 1,
          requiresAdminApproval: skill.requires_admin_approval === 1,
          requiresCert: skill.requires_cert === 1,
          rankOnlyIds: rankRestrictions,
          createdAt: new Date(skill.created_at).getTime() as any,
          updatedAt: new Date(skill.modified_at).getTime() as any,
          docType: DocType.Skill,
          migrationId: skill.id,
          orgId: process.env.ORG_ID!,
        };
        bulk.push(item);
      }
    }
    if (bulk.length > 0) {
      const res = await collection.insertMany(bulk);
      console.log('Skill bulk write: ', JSON.stringify(res, null, 2));
      // Set rank only ids
    }
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}