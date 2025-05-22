import { Context } from "../../../utils/createContext";
import {
  Notification,
  NotificationFrequency,
  NotificationSearchInput
} from "../../../__generated__/resolvers-types";
import { SearchResults } from "../../../utils/common.resolvers";
import { IInAppNotification } from "../../../models/inAppNotifications";
import logger from "../../../utils/logger";

export const Query = {
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
};
