import { Db, Collection, ObjectId } from 'mongodb';
import { DocType, NewOrganization, Organization } from '../__generated__/resolvers-types';
import logger from '../utils/logger';

export class OrganizationModel {
  collectionName: string = process.env.MONGODB_COLLECTION!;
  collection: Collection;
  constructor(private db: Db) {
    this.collection = this.db.collection(this.collectionName);
  }

  public async getById(id: string): Promise<Organization | null> {
    const res = await this.collection.findOne({ _id: new ObjectId(id), docType: DocType.Organization });
    if (!res) {
      return null;
    }
    const { _id, ...rest } = res;
    return {
      id: _id.toString(),
      ...rest,
    } as any;
  }

  public async createOrganization(org: NewOrganization): Promise<Organization> {
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