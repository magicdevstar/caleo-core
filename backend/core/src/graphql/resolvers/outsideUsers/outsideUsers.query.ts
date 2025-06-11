import { SearchInput } from "../../../__generated__/resolvers-types";
import { IOutsideUser } from "../../../models/outsideUsers/outsideUser.repository";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
  outsideUsers: async (
    _: any,
    { input }: { input: SearchInput },
    context: Context
  ): Promise<SearchResults<IOutsideUser>> => {
    return context.outsideUsers.search(input);
  },
}