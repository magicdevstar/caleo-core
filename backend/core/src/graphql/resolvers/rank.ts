import { GraphQLError } from "graphql";
import { Context } from "../..";
import { Rank, UpsertRank } from "../../__generated__/resolvers-types";

export const rank = {
  Query: {
    ranks: async (
      _parent: unknown,
      _args: unknown,
      { ranks }: Context
    ): Promise<Rank[]> => ranks.search()
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
      });
    },
  },
  fields: {
    Rank: {
      createdAt: (rank) => new Date(rank.createdAt).toISOString(),
      updatedAt: (rank) => new Date(rank.createdAt).toISOString(),
      org: (rank: Rank, _, { organizations }: Context) => organizations.get(rank.orgId),
    },
  },
};
