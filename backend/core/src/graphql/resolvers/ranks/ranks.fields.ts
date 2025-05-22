import { IRank } from "../../../models/rank";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  Rank: {
    ...commonResolvers,
    org: (rank: IRank, _, { organizations }: Context) => organizations.loader.load(rank.orgId.toString()),
    rankGroup: (rank: IRank, _, { rankGroups }: Context) => rank.rankGroupId ? rankGroups.loader.load(rank.rankGroupId.toString()) : null,
  },
};
