import { mysql } from "./utils/mysql";
import { DocType, Rank } from "./utils/resolvers-types";
import { Collection } from "mongodb";

export interface OldRank {
  id: number
  name: string
  is_active: number
  created_at: string
}

interface MongoRank extends Omit<Rank, 'id'> {
  migrationId: number
}

export const ranks = async (collection: Collection) => {
  try {
    const bulk: any = [];
    const migrationIds = (await collection
      .find({ migrationId: { $exists: true } })
      .project({ migrationId: 1 })
      .toArray())
      .map(({ migrationId }) => migrationId);
    for await (const rank of mysql<OldRank>('rank').stream()) {
      const foundMongo = migrationIds.includes(rank.id);
      if (!foundMongo) {
        const item: MongoRank = {
          name: rank.name,
          active: rank.is_active === 1,
          orgId: process.env.ORG_ID!,
          createdAt: new Date(rank.created_at).getTime() as any,
          updatedAt: new Date(rank.created_at).getTime() as any,
          docType: DocType.Rank,
          migrationId: rank.id,
        };
        bulk.push(item);
      }
    }
    if (bulk.length > 0) {
      const res = await collection.insertMany(bulk);
      console.log('Rank bulk write: ', JSON.stringify(res, null, 2));
    } 
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}