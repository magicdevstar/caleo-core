import { Db, ObjectId } from 'mongodb';
import { Division, DocType } from '../__generated__/resolvers-types';
import { Validations } from './base';
import { GraphQLError } from 'graphql';
import { divisionErrors } from '../utils/errors';
import { BaseMongo } from './base.v2';

export interface IDivision extends Omit<
  Division,
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

export class DivisionModel extends BaseMongo<IDivision> {
  constructor(db: Db) {
    super(db, DocType.Division, 'divisions');
    this.validator = {
      create: async (doc) => {
        const found = await this.collection.findOne({
          name: doc.name,
          orgId: doc.orgId,
          removedAt: { $exists: false },
        });
  
        if (found) {
          throw new GraphQLError('Division name must be unique', {
            extensions: {
              code: divisionErrors.NAME_MUST_BE_UNIQUE,
              argumentName: 'name',
            },
          });
        }
      }
    } as Validations<IDivision>;
  }
};
