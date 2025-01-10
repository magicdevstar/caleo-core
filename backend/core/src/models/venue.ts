import { Db, ObjectId } from 'mongodb';
import {
  DocType,
  UpsertVenueContact,
  Venue,
  VenueContact,
  VenueContract,
  VenueStatus
} from '../__generated__/resolvers-types';
import { BaseMongo } from './base.v2';

export interface IIVenue {
  address: string;
  city?: string;
  contact?: IVenueContact;
  contract?: IVenueContract;
  createdAt: Date;
  _id: ObjectId | string;
  id?: string;
  modifiedById?: ObjectId | string;
  name: string;
  notes?: string;
  orgId: ObjectId | string;
  phone?: string;
  removedAt?: Date;
  state?: string;
  status?: VenueStatus;
  updatedAt: Date;
  zip?: string;
}

export interface IVenueContact extends Omit<
  VenueContact,
  '__typename'
> {}

export interface IVenueContract extends Omit<
  VenueContract,
  'expirationDate'
> {
  expirationDate: Date;
}

export interface IVenue extends Omit<Venue, 'contract'> {
  contract?: IVenueContract;
}

export interface IUpsertVenueContract extends Omit<UpsertVenueContact, 'expirationDate'> {
  expirationDate: Date;
}

export class VenueModel extends BaseMongo<IIVenue> {
  constructor(db: Db) {
    super(db, DocType.Venue, 'venues');
  }

  async approveVenue(venueId: ObjectId | string, modifiedById: ObjectId) {
    await this.collection.updateOne(
      { _id: typeof venueId === 'string' ? new ObjectId(venueId) : venueId },
      {
        $set: {
          status: VenueStatus.Active,
          modifiedById,
          updatedAt: new Date()
        },
      }
    );
  }

  async rejectVenue(venueId: ObjectId | string, modifiedById: ObjectId) {
    await this.collection.updateOne(
      { _id: typeof venueId === 'string' ? new ObjectId(venueId) : venueId },
      {
        $set: {
          status: VenueStatus.Inactive,
          modifiedById,
          updatedAt: new Date()
        },
      }
    );
  }
};
