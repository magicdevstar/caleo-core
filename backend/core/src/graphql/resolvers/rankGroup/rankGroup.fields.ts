import { IRankGroup } from "../../../models/rankGroup/rankGroup.entity";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  RankGroup: {
    ...commonResolvers,
    org: (rankGroup: IRankGroup, _, { organizations }: Context) => organizations.loader.load(rankGroup.orgId.toString()),
    ranks: (rankGroup: IRankGroup, _, { ranks }: Context) => {
      if (!rankGroup.rankIds) {
        return [];
      }
      return ranks.loader.loadMany(rankGroup.rankIds.map((rank) => rank.toString()));
    },
  }
}