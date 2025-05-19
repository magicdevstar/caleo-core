import { UpsertRankGroup } from "../../../__generated__/resolvers-types";
import { adminOnly } from "../../../utils/access";
import { Context } from "../../../utils/createContext";

export const Mutation = {
  removeRankGroup: async (
    _parent: unknown,
    { id }: { id: string },
    { rankGroups, user }: Context
  ): Promise<string> => {
    adminOnly(user);

    await rankGroups.remove(id, {
      modifiedById: user!._id!,
    });

    return id;
  },
  rankGroup: async (
    _parent: unknown,
    { rankGroup: input }: { rankGroup: UpsertRankGroup },
    { rankGroups, user }: Context
  ): Promise<any> => {
    adminOnly(user);

    return rankGroups.upsert(
      rankGroups.convertToEntity(input, user!)
    );
  },
  addRanksToGroup: async (
    _parent: unknown,
    { rankGroupId, rankIds }: { rankGroupId: string; rankIds: string[] },
    { rankGroups, user }: Context
  ): Promise<any> => {
    adminOnly(user);

    await rankGroups.addRanks(rankGroupId, rankIds, user!);
    return true;
  },
  removeRanksFromGroup: async (
    _parent: unknown,
    { rankGroupId, rankIds }: { rankGroupId: string; rankIds: string[] },
    { rankGroups, user }: Context
  ): Promise<any> => {
    adminOnly(user);

    await rankGroups.removeRanks(rankGroupId, rankIds, user!);
    return true;
  },
};
