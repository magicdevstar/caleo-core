import { DivisionSearchInput } from "../../../__generated__/resolvers-types";
import { IDivision } from "../../../models/division";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
  division: async (
    _parent: unknown,
    { id }: { id: string },
    { division }: Context,
  ): Promise<IDivision | null> => division.get(id),
  divisions: async (
    _parent: unknown,
    { input }: { input: DivisionSearchInput },
    { division, user }: Context
  ): Promise<SearchResults<IDivision>> => division.search({
    orgId: user.member.orgId,
    queryField: 'name',
    ...input,
  }),
};
