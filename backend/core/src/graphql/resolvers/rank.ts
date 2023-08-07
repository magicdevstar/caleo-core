import { GraphQLError } from "graphql";
import { Context } from "../..";
import { Rank, SearchInput, UpsertRank } from "../../__generated__/resolvers-types";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";

export const rank = {
  Query: {
    rank: async (
      _parent: unknown,
      { id }: { id: string },
      { ranks }: Context,
    ): Promise<Rank | null> => ranks.get(id),
    ranks: async (
      _parent: unknown,
      { limit, skip }: SearchInput,
      { ranks, user }: Context
    ): Promise<SearchResults<Rank>> => ranks.search({
      orgId: user?.member.orgId!,
      limit,
      skip,
    })
  },
  Mutation: {
    removeRank: async (
      _parent: unknown,
      { id }: { id: string },
      { ranks }: Context
    ): Promise<string> => {
      await ranks.remove(id)
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
