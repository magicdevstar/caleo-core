import { RankSearchInput } from "../../../__generated__/resolvers-types";
import { IRank } from "../../../models/rank";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
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
    orgId: user.member.orgId!,
    queryField: 'name',
    ...input,
    orderBy: input.orderBy || 'name',
    order:  input.order || 'asc',
  }),
};
