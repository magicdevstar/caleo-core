import { Collection, Db, ObjectId } from 'mongodb';
import { DocType, InAppNotifications } from '../__generated__/resolvers-types';
import DataLoader from 'dataloader';
import { SearchResults } from '../utils/common.resolvers';
import logger from '../utils/logger';

export interface IInAppNotification extends Omit<
  InAppNotifications,
  'id' |
  'userId' |
  'orgId' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'org' |
  'user'
> {
  id: ObjectId;
  userId: ObjectId;
  orgId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export class InAppNotificationModel {
  collection: Collection;
  typeName: string = '';

  public loader = new DataLoader(async (keys: readonly ObjectId[]) => {
    const res = await this.collection.find({_id: {$in: keys}}).toArray();
    return keys.map((key) => res.find((item: any) => item._id === key));
  });

  constructor(db: Db) {
    this.collection = db.collection('inAppNotifications');
    const docType = DocType.InAppNotification;
    this.typeName = docType.charAt(0).toUpperCase() + docType.slice(1).toLowerCase();
  }

  async search({
    userId,
    limit = 10,
    skip,
  }: {
    userId: ObjectId;
    limit?: number;
    skip?: number;
  }): Promise<SearchResults<IInAppNotification>> {
    const query = {
      userId,
    };

    const collectionQuery = this.collection.find(query).sort({ createdAt: -1 });

    if (skip) {
      collectionQuery.skip(skip);
    }

    collectionQuery.limit(limit);

    const res = await collectionQuery.toArray();

    logger.info('InAppNotificationModel.search', { res, query });

    return {
      total: await this.collection.countDocuments(query),
      items: res.map(({ _id, ...item }) => ({ id: _id, ...item } as IInAppNotification))
    };
  }

  async create({
    title,
    body,
    templateName,
    userId,
    orgId,
  }: {
    title: string;
    body: string;
    templateName: string;
    userId: string;
    orgId: string;
  }): Promise<IInAppNotification> {
    const now = new Date();
    const document: Omit<IInAppNotification, 'id'> = {
      title,
      body,
      read: false,
      templateName,
      docType: DocType.InAppNotification,
      orgId: new ObjectId(orgId),
      userId: new ObjectId(userId),
      createdAt: now,
      updatedAt: now,
    };
    const result = await this.collection.insertOne(document);
    return {
      ...document,
      id: result.insertedId,
    } as IInAppNotification;
  }
};
