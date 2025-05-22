import { UnitSearchInput } from "../../../__generated__/resolvers-types";
import { IUnit } from "../../../models/unit";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
  unit: async (
    _parent: unknown,
    { id }: { id: string },
    { unit }: Context,
  ): Promise<IUnit | null> => unit.get(id),
  units: async (
    _parent: unknown,
    { input }: { input: UnitSearchInput },
    { unit, user }: Context
  ): Promise<SearchResults<IUnit>> => unit.search({
    orgId: user.member.orgId,
    queryField: 'name',
    ...input,
  }),
};
