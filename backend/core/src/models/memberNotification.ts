import { Db } from 'mongodb';
import { DocType, MemberNotification } from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import DataLoader from 'dataloader';
import { NotificationModel } from './nontification';

export class MemberNotificationModel extends BaseModel<MemberNotification> {
  public userLoader = new DataLoader(async (keys: readonly string[]) => {
    const { items: res } = await this.search({
      userId: { $in: keys },
    });
    return keys.map((key) => res.find((item: any) => item.id === key));
  });

  constructor(db: Db, private notifications: NotificationModel) {
    super(db, DocType.MemberNotification);
  }

  async seen({
    notificationIds,
    userId
  } : {
    notificationIds: string[];
    userId: string;
  }): Promise<void> {
    const now = Date.now();

    // Update existing notifications
    await this.collection.updateMany({
      notificationId: { $in: notificationIds },
      userId,
      docType: DocType.MemberNotification,
    }, {  $set: { lastSeen: now }});

    // Get all notifications
    const {items: allMemberNotifications} = await this.search({
      notificationId: { $in: notificationIds },
      userId,
    });

    // Create a notification map so we know what member notifications are already in the database
    const notificationMap = allMemberNotifications.reduce((acc, memberNotification) => {
      if (!acc[memberNotification.notificationId]) {
        acc[memberNotification.notificationId] = memberNotification;
      }
      return acc;
    }, {} as any);

    // Create a list of notifications that need to be created
    const newNotifications = notificationIds.filter((notificationId) => {
      return !notificationMap[notificationId];
    }).map((notificationId) => ({
      notificationId,
      userId,
      lastSeen: now as any,
      docType: DocType.MemberNotification,
    }) as Omit<MemberNotification, 'id'>);

    await this.collection.insertMany(newNotifications);
  }
};
