import { RankGroupSearchInput } from "../../../__generated__/resolvers-types";
import { IRankGroup } from "../../../models/rankGroup/rankGroup.entity";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
  rankGroups: async (
    _: any,
    { input }: { input: RankGroupSearchInput },
    { rankGroups, user }: Context
  ): Promise<SearchResults<IRankGroup>> => rankGroups.search({
    orgId: user.member.orgId,
    queryField: 'name',
    orderBy: 'name',
    order: 'asc',
    ...input,
  }),
};
