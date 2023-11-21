import { Db } from 'mongodb';
import { DocType, Venue } from '../__generated__/resolvers-types';
import { BaseModel, Validations } from './base';
import { GraphQLError } from 'graphql';
import { venueErrors } from '../utils/errors';

export class VenueModel extends BaseModel<Venue> {
  constructor(db: Db) {
    super(db, DocType.Venue, 'venues');
    this.validator = {
      create: async (doc) => {
        const found = await this.findOne({ name: doc.name, removedAt: { $exists: false } });
  
        if (found) {
          throw new GraphQLError('Venue name must be unique', {
            extensions: {
              code: venueErrors.NAME_MUST_BE_UNIQUE,
              argumentName: 'name',
            },
          });
        }
      }
    } as Validations<Venue>;
  }
};
