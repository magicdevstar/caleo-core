import { Context } from "../../utils/createContext";
import { SiteLock, UpsertSiteLock } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { commonResolvers } from "../../utils/common.resolvers";
import { ISiteLock } from "../../models/siteLock";
import { ObjectId } from "mongodb";

export const siteLock = {
  Query: {
    siteLock: async (
      _parent: unknown,
      _args: unknown,
      { siteLock, user }: Context,
    ): Promise<ISiteLock | null> => siteLock.getByOrgId(user?.member?.orgId!),
  },
  Mutation: {
    siteLock: async (
      _parent: unknown,
      { input }: { input: UpsertSiteLock },
      { siteLock, user }: Context
    ): Promise<ISiteLock | null> => {
      adminOnly(user);
      const lock = await siteLock.getByOrgId(user?.member?.orgId!);
      if (lock) {
        return siteLock.upsert({
          id: lock?._id?.toString(),
          ...input,
          orgId: user?.member.orgId!,
          modifiedById: user!._id!,
        } as any);
      }
      return null;
    },
  },
  fields: {
    SiteLock: {
      ...commonResolvers,
      org: (parent: ISiteLock, _, { organizations }: Context) => organizations.loader.load(parent.orgId.toString()),
    },
  },
};
