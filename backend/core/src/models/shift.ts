import { Db } from 'mongodb';
import { DocType, Shift } from '../__generated__/resolvers-types';
import { BaseModel } from './base';

export class ShiftModel extends BaseModel<Shift> {
  constructor(db: Db) {
    super(db, DocType.Shift);
  }
};
