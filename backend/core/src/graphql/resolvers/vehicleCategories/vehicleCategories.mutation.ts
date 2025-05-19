import { GraphQLError } from "graphql";
import { IVehicleCategory } from "../../../models/vehicleCategories";
import { adminOnly } from "../../../utils/access";
import { Context } from "../../../utils/createContext";

export const Mutation = {
    removeVehicleCategory: async (
      _parent: unknown,
      { id }: { id: string },
      {
        vehicleCategories,
        user,
      }: Context
    ): Promise<string> => {
      adminOnly(user);
      
      await vehicleCategories.remove(id, {
        modifiedById: user!._id!,
      });

      return id;
    },
    vehicleCategory: async (
      _parent: unknown,
      { vehicleCategory: inputVehicleCategory }: { vehicleCategory: IVehicleCategory },
      { vehicleCategories, user }: Context
    ): Promise<IVehicleCategory> => {
      adminOnly(user);
      if (Object.keys(inputVehicleCategory).length === 0) {
        throw new GraphQLError("Vehicle Category is empty");
      }
      return vehicleCategories.upsert({
        ...inputVehicleCategory,
        orgId: user?.member.orgId,
        modifiedById: user!._id!,
      });
    },
  };
