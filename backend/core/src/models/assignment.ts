import { Db } from 'mongodb';
import { Assignment, DocType } from '../__generated__/resolvers-types';
import { BaseModel } from './base';

export class AssignmentModel extends BaseModel<Assignment> {
  constructor(db: Db) {
    super(db, DocType.Assignment);
  }
};
