import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import { Rank, RankSearchInput, UpsertRank } from "../../__generated__/resolvers-types";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import logger from "../../utils/logger";

export const rank = {
  Query: {
    rank: async (
      _parent: unknown,
      { id }: { id: string },
      { ranks }: Context,
    ): Promise<Rank | null> => ranks.get(id),
    ranks: async (
      _parent: unknown,
      { input }: { input: RankSearchInput },
      { ranks, user }: Context
    ): Promise<SearchResults<Rank>> => ranks.search({
      orgId: user?.member.orgId!,
      queryField: 'name',
      ...input,
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
      }: Context
    ): Promise<string> => {
      const countUsersWithRole = await users.collection.countDocuments({
        'member.rankId': id,
      });

      if (countUsersWithRole > 0) {
        throw new GraphQLError("Cannot remove a rank that is assigned to users");
      }

      await ranks.remove(id);

      // Remove all references to the rank from any shifts
      const res = await skills.collection.updateMany({
        rankOnlyIds: id
      }, {
        $pull: {
          rankOnlyIds: id
        } as any,
      });

      return id;
    },
    rank: async (
      _parent: unknown,
      { rank }: { rank: UpsertRank },
      { ranks, user }: Context
    ): Promise<Rank> => {
      if (Object.keys(rank).length === 0) {
        throw new GraphQLError("Rank is empty");
      }
      return ranks.upsert({
        ...rank,
        orgId: user?.member.orgId!,
      } as any);
    },
  },
  fields: {
    Rank: {
      ...commonResolvers,
      org: (rank: Rank, _, { organizations }: Context) => organizations.loader.load(rank.orgId),
    },
  },
};
