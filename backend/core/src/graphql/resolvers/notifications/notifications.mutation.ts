import { GraphQLError } from "graphql/error";
import { NotificationFrequency, UpsertNotification } from "../../../__generated__/resolvers-types";
import { adminOnly } from "../../../utils/access";
import { Context } from "../../../utils/createContext";

export const Mutation = {
  removeInAppNotifications: async (
    _parent: unknown,
    { ids, removeAll }: { ids?: string[], removeAll?: boolean },
    { inAppNotifications, user }: Context
  ): Promise<boolean> => inAppNotifications.removeMany({
    ids,
    removeAll,
    userId: user!._id!
  }),
  readInAppNotifications: async (
    _parent: unknown,
    { ids, readAll }: { ids?: string[], readAll?: boolean },
    { inAppNotifications, user }: Context
  ): Promise<boolean> => inAppNotifications.markAsRead({
    ids,
    readAll,
    userId: user!._id!
  }),
  removeNotification: async (
    _parent: unknown,
    { id }: { id: string },
    { notifications, user }: Context
  ): Promise<string> => {
    adminOnly(user);
    await notifications.remove(id, {
      modifiedById: user.id!,
    });
    return id;
  },
  notification: async (
    _parent: unknown,
    { notification }: { notification: UpsertNotification },
    { notifications, user }: Context
  ): Promise<Notification> => {
    adminOnly(user);

    if (notification.frequency === NotificationFrequency.UntilExpire && !notification.expiration) {
      throw new GraphQLError('Until expire requires an expiration date');
    }

    notification.expiration = notification.frequency !== NotificationFrequency.UntilExpire ? null : new Date(notification.expiration as any) as any;

    return notifications.upsert({
      ...notification,
      orgId: user.member.orgId!.toString(),
      modifiedById: user.id!,
    } as any);
  },
  seenNotifications: async (
    _parent: unknown,
    { notificationIds }: { notificationIds: string[] },
    { memberNotifications, user }: Context
  ): Promise<boolean> => {
    await memberNotifications.seen({
      notificationIds,
      userId: user.id!,
    });
    return true;
  }
};
