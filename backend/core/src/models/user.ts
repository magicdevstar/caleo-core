import { Db } from 'mongodb';
import { DocType, User } from '../__generated__/resolvers-types';
import { BaseModel } from './base';

export class UserModel extends BaseModel<User> {
  constructor(db: Db) {
    super(db, DocType.User);
  }
}