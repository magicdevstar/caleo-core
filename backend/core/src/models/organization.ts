import { Db, Collection } from 'mongodb';
import { DocType, NewOrganization, Organization as Org } from '../__generated__/resolvers-types';
import logger from '../utils/logger';

export class Organization {
  collectionName: string = process.env.MONGODB_COLLECTION!;
  collection: Collection;
  constructor(private db: Db) {
    this.collection = this.db.collection(this.collectionName);
  }

  public async createOrganization(org: NewOrganization): Promise<Org> {
    const now = Date.now();
    const insertDoc = {
      ...org,
      docType: DocType.Organization,
      createdAt: now,
      updatedAt: now,
    };
    const res = await this.collection.insertOne(insertDoc);
    const organization = {
      id: res.insertedId.toString(),
      ...insertDoc,
      createdAt: insertDoc.createdAt as any,
      updatedAt: insertDoc.updatedAt as any,
    };

    logger.info('Organization created', { res, organization });

    return organization;
  }
}