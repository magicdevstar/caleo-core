import { BranchSearchInput } from "../../../__generated__/resolvers-types";
import { IBranch } from "../../../models/branch";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
  branch: async (
    _parent: unknown,
    { id }: { id: string },
    { branches }: Context,
  ): Promise<IBranch | null> => branches.get(id),
  branches: async (
    _parent: unknown,
    { input }: { input: BranchSearchInput },
    { branches, user }: Context
  ): Promise<SearchResults<IBranch>> => branches.search({
    orgId: user.member.orgId,
    queryField: 'name',
    ...input,
  }),
};
