import { ObjectId } from "mongodb";
import { adminOnly } from "../../../utils/access";
import { Context } from "../../../utils/createContext";
import { GraphQLError } from "graphql/error";
import { IRank } from "../../../models/rank";

export const Mutation = {
  removeRank: async (
    _parent: unknown,
    { id }: { id: string },
    {
      ranks,
      rankGroups,
      skills,
      users,
      user,
    }: Context
  ): Promise<string> => {
    adminOnly(user);
    const existingUserWithRole = await users.collection.findOne({
      'member.rankId': new ObjectId(id),
    });

    if (existingUserWithRole) {
      throw new GraphQLError("Cannot remove a rank that is assigned to users");
    }

    const rank = await ranks.get(id);
    if (!rank) {
      throw new GraphQLError("Rank not found");
    }

    await ranks.remove(id, {
      modifiedById: user!._id!,
    });

    const idAsObjectId = new ObjectId(id);
    // Remove all references to the rank from any skills
    await skills.collection.updateMany({
      rankOnlyIds: idAsObjectId
    }, {
      $set: {
        modifiedById: user!._id!,
      },
      $pull: {
        rankOnlyIds: idAsObjectId
      } as any,
    });

    // Remove the rank from any rank groups
    if (rank.rankGroupId) {
      await rankGroups.removeRanks(rank.rankGroupId.toString(), [id], user!);
    }

    return id;
  },
  rank: async (
    _parent: unknown,
    { rank }: { rank: IRank },
    { ranks, rankGroups, user }: Context
  ): Promise<IRank> => {
    adminOnly(user);
    if (Object.keys(rank).length === 0) {
      throw new GraphQLError("Rank is empty");
    }
    let existingRank: IRank | null = null;
    if (rank.id) {
      existingRank = await ranks.get(rank.id);
    }

    const finalRank = await ranks.upsert({
      ...existingRank,
      ...rank,
      ...(rank.rankGroupId ? { rankGroupId: new ObjectId(rank.rankGroupId) } : { rankGroupId: null }),
      orgId: user.member.orgId,
      modifiedById: user!._id!,
    });

    // Add to rank group if we added a rank group id
    if (rank.rankGroupId && finalRank.id) {
      await rankGroups.addRanks(rank.rankGroupId.toString(), [finalRank.id], user!);
    }

    // Remove rank group if one was removed
    if (existingRank && existingRank.rankGroupId && rank.rankGroupId !== existingRank.rankGroupId) {
      await rankGroups.removeRanks(existingRank.rankGroupId.toString(), [existingRank.id!], user!);
    }

    return finalRank;
  },
};
