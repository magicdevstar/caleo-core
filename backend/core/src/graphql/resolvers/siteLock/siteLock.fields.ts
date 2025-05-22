import { ISiteLock } from "../../../models/siteLock";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  SiteLock: {
    ...commonResolvers,
    org: (parent: ISiteLock, _, { organizations }: Context) => organizations.loader.load(parent.orgId.toString()),
  },
};
