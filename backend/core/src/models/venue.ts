import { Db } from 'mongodb';
import {
  DocType,
  UpsertVenue,
  UpsertVenueContact,
  Venue,
  VenueContract
} from '../__generated__/resolvers-types';
import { BaseModel, Validations } from './base';
import { GraphQLError } from 'graphql';
import { venueErrors } from '../utils/errors';

export interface IVenueContract extends Omit<VenueContract, 'expirationDate'> {
  expirationDate: Date;
}

export interface IVenue extends Omit<Venue, 'contract'> {
  contract?: IVenueContract;
}

export interface IUpsertVenueContract extends Omit<UpsertVenueContact, 'expirationDate'> {
  expirationDate: Date;
}

export interface IUpsertVenue extends Omit<UpsertVenue, 'contract'> {
  contract?: IUpsertVenueContract;
}

export class VenueModel extends BaseModel<Venue> {
  constructor(db: Db) {
    super(db, DocType.Venue, 'venues');
    this.validator = {
      create: async (doc) => {
        const found = await this.findOne({
          name: doc.name,
          orgId: doc.orgId,
          removedAt: { $exists: false }
        });
  
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
