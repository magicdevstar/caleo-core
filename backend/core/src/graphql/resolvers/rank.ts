import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import { RankSearchInput } from "../../__generated__/resolvers-types";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { ObjectId } from "mongodb";
import { IRank } from "../../models/rank";
import { adminOnly } from "../../utils/access";

export const rank = {
  Query: {
    rank: async (
      _parent: unknown,
      { id }: { id: string },
      { ranks }: Context,
    ): Promise<IRank | null> => ranks.get(id),
    ranks: async (
      _parent: unknown,
      { input }: { input: RankSearchInput },
      { ranks, user }: Context
    ): Promise<SearchResults<IRank>> => ranks.search({
      orgId: user?.member.orgId!,
      queryField: 'name',
      ...input,
      orderBy: input.orderBy || 'name',
      order:  input.order || 'asc',
    }),
  },
  Mutation: {
    removeRank: async (
      _parent: unknown,
      { id }: { id: string },
      {
        ranks,
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

      return id;
    },
    rank: async (
      _parent: unknown,
      { rank }: { rank: IRank },
      { ranks, user }: Context
    ): Promise<IRank> => {
      adminOnly(user);
      if (Object.keys(rank).length === 0) {
        throw new GraphQLError("Rank is empty");
      }
      return ranks.upsert({
        ...rank,
        orgId: user?.member.orgId!,
        modifiedById: user!._id!,
      });
    },
  },
  fields: {
    Rank: {
      ...commonResolvers,
      org: (rank: IRank, _, { organizations }: Context) => organizations.loader.load(rank.orgId.toString()),
    },
  },
};
