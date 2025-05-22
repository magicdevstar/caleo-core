import { IDivision } from "../../../models/division";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  Division: {
    ...commonResolvers,
    org: (division: IDivision, _, { organizations }: Context) => organizations.loader.load(division.orgId.toString()),
  },
};