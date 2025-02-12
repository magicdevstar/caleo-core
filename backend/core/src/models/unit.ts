import { Db, ObjectId } from 'mongodb';
import { DocType, Unit } from '../__generated__/resolvers-types';
import { Validations } from './base';
import { GraphQLError } from 'graphql';
import { unitErrors } from '../utils/errors';
import { BaseMongo } from './base.v2';

export interface IUnit extends Omit<
  Unit,
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

export class UnitModel extends BaseMongo<IUnit> {
  constructor(db: Db) {
    super(db, DocType.Unit, 'units');
    this.validator = {
      create: async (doc) => {
        const found = await this.collection.findOne({
          name: doc.name,
          orgId: doc.orgId,
          removedAt: { $exists: false },
        });
  
        if (found) {
          throw new GraphQLError('Unit name must be unique', {
            extensions: {
              code: unitErrors.NAME_MUST_BE_UNIQUE,
              argumentName: 'name',
            },
          });
        }
      }
    } as Validations<IUnit>;
  }
};
