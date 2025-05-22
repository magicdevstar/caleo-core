import { UpsertSiteLock } from "../../../__generated__/resolvers-types";
import { ISiteLock } from "../../../models/siteLock";
import { adminOnly } from "../../../utils/access";
import { Context } from "../../../utils/createContext";

export const Mutation = {
  siteLock: async (
    _parent: unknown,
    { input }: { input: UpsertSiteLock },
    { siteLock, user }: Context
  ): Promise<ISiteLock | null> => {
    adminOnly(user);
    const lock = await siteLock.getByOrgId(user.member.orgId);
    if (lock) {
      return siteLock.upsert({
        id: lock?._id?.toString(),
        ...input,
        orgId: user.member.orgId,
        modifiedById: user!._id!,
      } as any);
    }
    return null;
  },
};
