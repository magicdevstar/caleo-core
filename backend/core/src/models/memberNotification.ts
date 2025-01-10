import { Db, ObjectId } from 'mongodb';
import { DocType } from '../__generated__/resolvers-types';
import DataLoader from 'dataloader';
import { BaseMongo } from './base.v2';

export interface IMemberNotification {
  _id?: ObjectId;
  id?: string;
  notificationId: ObjectId;
  userId: ObjectId;
  lastSeen: Date;
}

export class MemberNotificationModel extends BaseMongo<IMemberNotification> {
  public userLoader = new DataLoader(async (keys: readonly string[]) => {
    const keysAsObjectId = keys.map((id) => new ObjectId(id));
    const { items: res } = await this.search({
      userId: { $in: keysAsObjectId },
    });
    return keysAsObjectId.map((key) => res.find((item) => item.userId === key));
  });

  public seenLoader = new DataLoader(async (keys: readonly {notificationId: string; userId: string}[]) => {
    const notificationIds = keys.map(({ notificationId }) => new ObjectId(notificationId));
    const userId = new ObjectId(keys?.[0].userId);
    const { items: res } = await this.search({
      notificationId: { $in: notificationIds },
      userId,
    });
    return notificationIds.map((notificationId) => !!res.find((item) => item.notificationId === notificationId));
  });

  constructor(db: Db) {
    super(db, DocType.MemberNotification, 'memberNotifications');
  }

  async seen({
    notificationIds,
    userId
  } : {
    notificationIds: string[];
    userId: string;
  }): Promise<void> {
    const now = new Date();

    const userIdAsObjectId = new ObjectId(userId);
    const notificationIdsAsObjectId = notificationIds.map((id) => new ObjectId(id));
    // Update existing notifications
    await this.collection.updateMany({
      notificationId: { $in: notificationIdsAsObjectId },
      userId: userIdAsObjectId,
    }, { $set: { lastSeen: now }});

    // Get all notifications
    const {items: allMemberNotifications} = await this.search({
      notificationId: { $in: notificationIdsAsObjectId },
      userId: userIdAsObjectId,
    });

    // Create a notification map so we know what member notifications are already in the database
    const notificationMap = allMemberNotifications.reduce((acc, memberNotification) => {
      if (!acc[memberNotification.notificationId.toString()]) {
        acc[memberNotification.notificationId.toString()] = memberNotification;
      }
      return acc;
    }, {} as any);

    // Create a list of notifications that need to be created
    const newNotifications = notificationIds.filter((notificationId) => {
      return !notificationMap[notificationId];
    }).map((notificationId) => ({
      notificationId: new ObjectId(notificationId),
      userId: userIdAsObjectId,
      lastSeen: now,
    }) as IMemberNotification);

    if (newNotifications.length > 0) {
      await this.collection.insertMany(newNotifications);
    }
  }
};
