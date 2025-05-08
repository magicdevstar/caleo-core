import { IVehicleCategory } from "../../../models/vehicleCategories";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  VehicleCategories: {
    ...commonResolvers,
    org: (
      vehicleCategory: IVehicleCategory,
      _: unknown,
      { organizations }: Context
    ) => organizations.loader.load(vehicleCategory.orgId.toString()),
  },
}