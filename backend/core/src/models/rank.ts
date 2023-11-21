import { Db } from 'mongodb';
import { DocType, Rank } from '../__generated__/resolvers-types';
import { BaseModel, Validations } from './base';
import { GraphQLError } from 'graphql';
import { rankErrors } from '../utils/errors';

export class RankModel extends BaseModel<Rank> {
  constructor(db: Db) {
    super(db, DocType.Rank, 'ranks');
    this.validator = {
      create: async (doc) => {
        const found = await this.findOne({ name: doc.name, removedAt: { $exists: false } });
  
        if (found) {
          throw new GraphQLError('Rank name must be unique', {
            extensions: {
              code: rankErrors.NAME_MUST_BE_UNIQUE,
              argumentName: 'name',
            },
          });
        }
      }
    } as Validations<Rank>;
  }
};
