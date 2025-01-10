import { Db, ObjectId } from 'mongodb';
import { DocType, SiteLock } from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import { BaseMongo } from './base.v2';

export interface ISiteLock extends Omit<
  SiteLock,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'orgId' |
  'org' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  orgId: ObjectId;
  modifiedById: ObjectId;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export class SiteLockModel extends BaseMongo<ISiteLock> {
  constructor(db: Db) {
    super(db, DocType.SiteLock, 'siteLocks');
  }

  async getByOrgId(orgId: ObjectId) {
    return this.collection.findOne<ISiteLock>({ orgId });
  }
};
