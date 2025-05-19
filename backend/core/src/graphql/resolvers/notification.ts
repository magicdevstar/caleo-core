import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import { Notification, NotificationFrequency, NotificationSearchInput, UpsertNotification } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { IInAppNotification } from "../../models/inAppNotifications";
import logger from "../../utils/logger";

export const notification = {
  Query: {
    notification: async (
      _parent: unknown,
      { id }: { id: string },
      { notifications }: Context,
    ): Promise<Notification | null> => notifications.get(id),
    notifications: async (
      _parent: unknown,
      { input }: {input: NotificationSearchInput},
      { notifications, user }: Context
    ): Promise<SearchResults<Notification>> => await notifications.search({
        orgId: user?.member.orgId!.toString(),
        queryField: 'title',
        ...input,
      }),
    inAppNotifications: async (
      _parent: unknown,
      {
        input: {
          limit,
          skip,
          read,
          order,
          orderBy,
        }
      }: {
        input: {
          limit: number;
          skip: number;
          read?: boolean;
          orderBy?: string;
          order?: string;
        }
      },
      { inAppNotifications, user }: Context
    ): Promise<SearchResults<IInAppNotification>> => {
      logger.info('inAppNotifications', {limit, skip});
      const res = await inAppNotifications.search({
        limit,
        skip,
        read,
        order,
        orderBy,
        userId: user._id!,
      });
      return res;
    },
    activeNotifications: async (
      _parent: unknown,
      { limit, skip }: NotificationSearchInput,
      { notifications, user }: Context
    ): Promise<SearchResults<Notification>> => notifications.search(
      JSON.parse(JSON.stringify({
        limit,
        skip,
        orgId: user.member.orgId!,
        orderBy: 'updatedAt',
        $and: [
          {
            $or: [
              {
                expiration: { $exists: false }
              },
              {
                expiration: null,
              },
              {
                $and: [
                  { frequency: NotificationFrequency.UntilExpire },
                  { expiration: { $exists: true } },
                  { expiration: { $gte: Date.now() } }
                ]
              }
            ],
          },
          {
            $or: [
              {rankIds: { $exists: false }},
              {rankIds: { $size: 0 }},
              {rankIds: {$in: [user?.member.rankId.toString()]},}
            ]
          }
        ],
        order: 'desc',
        active: true
      }))
    ),
  },
  Mutation: {
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
  },
  fields: {
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
  },
};
