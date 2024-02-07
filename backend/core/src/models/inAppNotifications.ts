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

  async removeMany({
    ids,
    userId,
    removeAll,
  }: {
    ids?: string[];
    removeAll?: boolean;
    userId: ObjectId;
  }) {
    if (removeAll) {
      await this.collection.updateMany({
        userId,
      }, {
        $set: {
          read: true,
          removedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else if (ids) {
      await this.collection.updateMany({
        userId,
        _id: { $in: ids.map((id) => new ObjectId(id)) },
      }, {
        $set: {
          read: true,
          removedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return true;
  };

  async markAsRead({
    ids,
    readAll,
    userId,
  }: {
    ids?: string[];
    readAll?: boolean;
    userId: ObjectId;
  }) {
    if (readAll) {
      await this.collection.updateMany({
        userId,
        read: false,
      }, {
        $set: {
          read: true,
          updatedAt: new Date(),
        },
      });
    } else if (ids) {
      await this.collection.updateMany({
        userId,
        read: false,
        _id: { $in: ids.map((id) => new ObjectId(id)) },
      }, {
        $set: {
          read: true,
          updatedAt: new Date(),
        },
      });
    }
    return true
  }

  unreadCount(userId: ObjectId) {
    return this.collection.countDocuments({
      userId,
      read: false,
    });
  }

  async search({
    userId,
    limit = 10,
    read,
    order = 'desc',
    orderBy = 'createdAt',
    skip,
  }: {
    userId: ObjectId;
    read?: boolean;
    limit?: number;
    order?: string;
    orderBy?: string;
    skip?: number;
  }): Promise<SearchResults<IInAppNotification>> {
    const query = {
      userId,
      removedAt: { $exists: false },
      ...(typeof read === 'boolean' && { read }),
    };

    const collectionQuery = this.collection.find(query).sort({ [orderBy]: order === 'asc' ? 1 : -1 });

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
