import { BrowserNotificationSetting, InputBrowserNotificationSubscription } from "../../../__generated__/resolvers-types";
import { adminOrOwnerOnly } from "../../../utils/access";
import { Context } from "../../../utils/createContext";

export const Mutation = {
  browserNotificationSubscription: async (
    _parent: unknown,
    { input }: { input: InputBrowserNotificationSubscription },
    { browserNotificationSubscriptions, user }: Context
  ): Promise<BrowserNotificationSetting> => {
    adminOrOwnerOnly(user!.id!, user);
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
    adminOrOwnerOnly(user!.id!, user);
    await browserNotificationSubscriptions.removeSubscription({
      user: user!,
      endpoint,
    });
    return true;
  }
};
