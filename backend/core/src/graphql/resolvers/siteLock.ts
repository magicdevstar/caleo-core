import { Context } from "../../utils/createContext";
import { SiteLock, UpsertSiteLock } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { commonResolvers } from "../../utils/common.resolvers";

export const siteLock = {
  Query: {
    siteLock: async (
      _parent: unknown,
      _args: unknown,
      { siteLock, user }: Context,
    ): Promise<SiteLock | null> => siteLock.getByOrgId(user?.member?.orgId!),
  },
  Mutation: {
    siteLock: async (
      _parent: unknown,
      { input }: { input: UpsertSiteLock },
      { siteLock, user }: Context
    ): Promise<SiteLock> => {
      adminOnly(user);
      const lock = await siteLock.getByOrgId(user?.member?.orgId!);
      return siteLock.upsert({
        ...lock,
        ...input,
        orgId: user?.member.orgId!,
        modifiedById: user!.id,
      } as any);
    },
  },
  fields: {
    SiteLock: {
      ...commonResolvers,
      org: (parent: SiteLock, _, { organizations }: Context) => organizations.loader.load(parent.orgId),
    },
  },
};
