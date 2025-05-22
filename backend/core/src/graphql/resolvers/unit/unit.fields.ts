import { IUnit } from "../../../models/unit";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  Unit: {
    ...commonResolvers,
    org: (unit: IUnit, _, { organizations }: Context) => organizations.loader.load(unit.orgId.toString()),
    divisions: (unit: IUnit, _, { division }: Context) => {
      if (!unit.divisionIds) {
        return [];
      }
      return division.loader.loadMany(unit.divisionIds.map((id) => id.toString()));
    }
  },
};
