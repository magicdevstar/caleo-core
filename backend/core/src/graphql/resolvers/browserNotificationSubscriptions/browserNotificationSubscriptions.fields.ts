import { BrowserNotificationSetting } from "../../../__generated__/resolvers-types";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  BrowserNotificationSetting: {
    ...commonResolvers,
    org: (parent: BrowserNotificationSetting, _, { organizations }: Context) => organizations.loader.load(parent.orgId),
  },
};
