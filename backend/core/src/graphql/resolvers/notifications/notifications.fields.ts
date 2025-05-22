import { Context } from "../../../utils/createContext";
import { Notification } from "../../../__generated__/resolvers-types";
import { commonResolvers } from "../../../utils/common.resolvers";
import { IInAppNotification } from "../../../models/inAppNotifications";

export const fields = {
  InAppNotificationSearchResult: {
    unreadCount: async (
      _result,
      _args,
      { inAppNotifications, user } : Context
    ) => inAppNotifications.unreadCount(user!._id!)
  },
  InAppNotifications: {
    createdAt: (notification: IInAppNotification) => notification.createdAt.toISOString(),
    updatedAt: (notification: IInAppNotification) => notification.updatedAt.toISOString(),
    removedAt: (notification: IInAppNotification) => notification.removedAt && notification.removedAt.toISOString(),
  },
  Notification: {
    ...commonResolvers,
    org: (notification: Notification, _, { organizations }: Context) => organizations.loader.load(notification.orgId),
    createdBy: (notification: Notification, _, { users }: Context) => notification.createdById ? users.loader.load(notification.createdById) : null,
    expiration: (notification: Notification) => notification.expiration ? new Date(notification.expiration).toISOString() : null,
    ranks: (notification: Notification, _, { ranks }: Context) =>
      notification.rankIds ?
        ranks.loader.loadMany(notification.rankIds as string[]) :
        [],
    seen: (notification: Notification, _, { memberNotifications, user }: Context) =>
      memberNotifications.seenLoader.load({
        notificationId: notification.id,
        userId: user.id!,
      }),
    memberNotification: (_notification: Notification, _, { memberNotifications, user }: Context) => memberNotifications.userLoader.load(user.id!),
  },
};
