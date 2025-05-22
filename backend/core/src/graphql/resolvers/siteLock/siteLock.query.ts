import { ISiteLock } from "../../../models/siteLock";
import { Context } from "../../../utils/createContext";

export const Query = {
  siteLock: async (
    _parent: unknown,
    _args: unknown,
    { siteLock, user }: Context,
  ): Promise<ISiteLock | null> => siteLock.getByOrgId(user.member.orgId),
};
