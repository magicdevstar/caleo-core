import { Context } from "../../utils/createContext";
import { adminOnly, adminOrOwnerOnly } from "../../utils/access";
import { commonResolvers } from "../../utils/common.resolvers";
import { BrowserNotificationSetting, InputBrowserNotificationSubscription } from "../../__generated__/resolvers-types";

export const browserNotificationSubscriptions = {
  Query: {},
  Mutation: {
    browserNotificationSubscription: async (
      _parent: unknown,
      { input }: { input: InputBrowserNotificationSubscription },
      { browserNotificationSubscriptions, user }: Context
    ): Promise<BrowserNotificationSetting> => {
      adminOrOwnerOnly(user!.id, user);
      return browserNotificationSubscriptions.upsertNotificationSubscription({
        user: user!,
        input
      });
    },
    removeBrowserNotificationSubscription: async (
      _parent: unknown,
      { endpoint }: { endpoint: string },
      { browserNotificationSubscriptions, user }: Context
    ): Promise<boolean> => {
      adminOrOwnerOnly(user!.id, user);
      await browserNotificationSubscriptions.removeSubscription({
        user: user!,
        endpoint,
      });
      return true;
    }
  },
  fields: {
    BrowserNotificationSetting: {
      ...commonResolvers,
      org: (parent: BrowserNotificationSetting, _, { organizations }: Context) => organizations.loader.load(parent.orgId),
    },
  },
};
