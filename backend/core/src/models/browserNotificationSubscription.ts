import { Db, ObjectId } from 'mongodb';
import { DocType, BrowserNotificationSetting, User, InputBrowserNotificationSubscription } from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import DataLoader from 'dataloader';
import { IUser } from '../types/common';

export class BrowserNotificationSubscription extends BaseModel<BrowserNotificationSetting> {
  public userIdLoader = new DataLoader(async (keys: readonly ObjectId[]) => {
    const res = await this.find({
      userId: { $in: keys },
    });
    const groupedByUserId = res.reduce((acc: any, item: any) => {
      const id = item.userId.toString();
      if (!acc[id]) {
        acc[id] = [];
      }
      acc[id].push(item);
      return acc;
    } , {});

    return keys.map((key) => groupedByUserId[key.toString()] || []);
  });

  constructor(db: Db) {
    super(db, DocType.BrowserNotificationSetting, 'browserNotificationSubscriptions');
  }

  async removeSubscription({ user, endpoint }: { user: IUser; endpoint: string }) {
    return this.collection.deleteOne({
      userId: user._id,
      'subscription.endpoint': endpoint,
    });
  }

  async upsertNotificationSubscription({
    user,
    input
  }: {
    user: IUser;
    input: InputBrowserNotificationSubscription,
  }): Promise<BrowserNotificationSetting> {
    const found = await this.collection.findOne({
      userId: new ObjectId(user.id),
      'subscription.endpoint': input.endpoint,
    });
    if (found) {
      return {
        id: found._id.toString(),
        orgId: found.orgId.toString(),
        userId: found.userId.toString(),
        createdAt: found.createdAt,
        updatedAt: found.updatedAt,
        subscription: found.subscription,
      };
    }

    const now = new Date();
    const doc = {
      orgId: user.member.orgId,
      userId: user._id!,
      createdAt: now,
      updatedAt: now,
      subscription: input,
    };
    const done = await this.collection.insertOne(doc);

    return {
      id: done.insertedId.toString(),
      orgId: doc.orgId.toString(),
      userId: doc.userId.toString(),
      createdAt: doc.createdAt as any,
      updatedAt: doc.updatedAt as any,
      subscription: doc.subscription,
    };
  }

  async getByUserId(userId: string) {
    return this.find({ userId: new ObjectId(userId) });
  }
};
