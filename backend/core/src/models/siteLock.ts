import { Db } from 'mongodb';
import { DocType, SiteLock } from '../__generated__/resolvers-types';
import { BaseModel } from './base';

export class SiteLockModel extends BaseModel<SiteLock> {
  constructor(db: Db) {
    super(db, DocType.SiteLock, 'siteLocks');
  }

  async getByOrgId(orgId: string) {
    return this.findOne({ orgId });
  }
};
