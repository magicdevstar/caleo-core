import { Db, ObjectId } from 'mongodb';
import { DocType, OutsideUser } from '../../__generated__/resolvers-types';
import { BaseMongo } from './../base.v2';

export interface IOutsideUser extends Omit<
  OutsideUser,
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

export interface IOutsideUser extends Omit<
  OutsideUser,
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

export class OutsideUserRepo extends BaseMongo<IOutsideUser> {
  constructor(db: Db) {
    super(db, DocType.OutsideUser, 'outsideUsers');
  }
};
