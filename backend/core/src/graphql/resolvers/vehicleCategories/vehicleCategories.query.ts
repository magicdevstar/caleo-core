import { VehicleCategoriesSearchInput } from "../../../__generated__/resolvers-types";
import { IVehicleCategory } from "../../../models/vehicleCategories";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
  vehicleCategory: async (
    _parent: unknown,
    { id }: { id: string },
    { vehicleCategories }: Context,
  ): Promise<IVehicleCategory | null> => vehicleCategories.get(id),
  vehicleCategories: async (
    _parent: unknown,
    { input }: { input: VehicleCategoriesSearchInput },
    { vehicleCategories, user }: Context
  ): Promise<SearchResults<IVehicleCategory>> => vehicleCategories.search({
    orgId: user?.member.orgId,
    queryField: 'name',
    ...input,
  }),
};
