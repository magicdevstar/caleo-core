import { IBranch } from "../../../models/branch";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  Branch: {
    ...commonResolvers,
    org: (b: IBranch, _: any, { organizations }: Context) => organizations.loader.load(b.orgId.toString()),
  },
};