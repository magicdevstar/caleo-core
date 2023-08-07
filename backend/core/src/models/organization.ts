import { Db } from 'mongodb';
import { DocType, NewOrganization, Organization } from '../__generated__/resolvers-types';
import logger from '../utils/logger';
import { BaseModel } from './base';

export class OrganizationModel extends BaseModel<Organization> {
  constructor(db: Db) {
    super(db, DocType.Organization);
  }

  public async create(org: any): Promise<any> {
    const inputOrg = org as NewOrganization;
    const now = Date.now();
    const insertDoc = {
      ...inputOrg,
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

    return organization as Organization;
  }
}