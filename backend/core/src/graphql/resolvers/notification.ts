import { Context } from "../..";
import { Notification, SearchInput, UpsertNotification } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";

export const notification = {
  Query: {
    notification: async (
      _parent: unknown,
      { id }: { id: string },
      { notifications }: Context,
    ): Promise<Notification | null> => notifications.get(id),
    notifications: async (
      _parent: unknown,
      input: SearchInput,
      { notifications, user }: Context
    ): Promise<SearchResults<Notification>> => await notifications.search({
        orgId: user?.member.orgId!,
        limit: input.limit,
        skip: input.skip,
      }),
    activeNotifications: async (
      _parent: unknown,
      { limit, skip }: SearchInput,
      { notifications, user }: Context
    ): Promise<SearchResults<Notification>> => notifications.search({
      limit,
      skip,
      orgId: user?.member.orgId!,
      active: true
    }),
  },
  Mutation: {
    removeNotification: async (
      _parent: unknown,
      { id }: { id: string },
      { notifications, user }: Context
    ): Promise<string> => {
      adminOnly(user);
      await notifications.remove(id)
      return id;
    },
    notification: async (
      _parent: unknown,
      { notification }: { notification: UpsertNotification },
      { notifications, user }: Context
    ): Promise<Notification> => {
      adminOnly(user);
      return notifications.upsert({
        ...notification,
        orgId: user?.member.orgId!,
      } as any);
    },
    seenNotifications: async (
      _parent: unknown,
      { notificationIds }: { notificationIds: string[] },
      { memberNotifications, user }: Context
    ): Promise<boolean> => {
      await memberNotifications.seen({
        notificationIds,
        userId: user?.id!,
      });
      return true;
    }
  },
  fields: {
    Notification: {
      ...commonResolvers,
      org: (notification: Notification, _, { organizations }: Context) => organizations.loader.load(notification.orgId),
      createdBy: (notification: Notification, _, { users }: Context) => users.loader.load(notification.createdById),
      ranks: (notification: Notification, _, { ranks }: Context) =>
        notification.rankIds ?
          ranks.loader.loadMany(notification.rankIds as string[]) :
          [],
      memberNotification: (_notification: Notification, _, { memberNotifications, user }: Context) => memberNotifications.userLoader.load(user?.id!),
    },
  },
};
