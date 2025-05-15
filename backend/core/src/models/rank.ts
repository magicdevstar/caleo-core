import { Db, ObjectId } from 'mongodb';
import { DocType, Rank } from '../__generated__/resolvers-types';
import { Validations } from './base';
import { GraphQLError } from 'graphql';
import { rankErrors } from '../utils/errors';
import { BaseMongo } from './base.v2';

export interface IRank extends Omit<
  Rank,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'rankGroupId' |
  'rankGroup' |
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
  rankGroupId?: ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export class RankModel extends BaseMongo<IRank> {
  constructor(db: Db) {
    super(db, DocType.Rank, 'ranks');
    this.validator = {
      create: async (doc) => {
        const found = await this.collection.findOne({
          name: doc.name,
          orgId: doc.orgId,
          removedAt: { $exists: false },
        });
  
        if (found) {
          throw new GraphQLError('Rank name must be unique', {
            extensions: {
              code: rankErrors.NAME_MUST_BE_UNIQUE,
              argumentName: 'name',
            },
          });
        }
      }
    } as Validations<IRank>;
  }
};
