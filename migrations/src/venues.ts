import { mysql } from "./utils/mysql";
import { mongo } from "./utils/mongodb";
import { DocType, Venue, VenueStatus } from "./utils/resolvers-types";
import { Collection } from "mongodb";

export interface OldVenue {
  id: number
  name: string
  address: string
  city: string
  state: string
  zipcode: string
  notes: any
  contact_first_name: string
  contact_last_name: string
  contact_email: any
  contact_phone: string
  created_at: Date
  status: string
  phone_number: any
  note: string
}

interface MongoVenue extends Omit<Omit<Venue, 'id'>, 'org'> {
  migrationId: number
}

const statusMap: Record<string, VenueStatus> = {
  Active: VenueStatus.Active,
  Inactive: VenueStatus.Inactive,
}

export const venues = async (collection: Collection) => {
  try {
    const bulk: any = [];
    const migrationIds = (await collection
      .find({ migrationId: { $exists: true } })
      .project({ migrationId: 1 })
      .toArray())
      .map(({ migrationId }) => migrationId);
    for await (const venue of mysql<OldVenue>('venue').stream()) {
      const foundMongo = migrationIds.includes(venue.id);
      if (!foundMongo) {
        const mongoVenue: MongoVenue = {
          name: venue.name,
          address: venue.address,
          city: venue.city,
          state: venue.state,
          zip: venue.zipcode,
          phone: venue.phone_number,
          notes: venue.note,
          contact: {
            firstName: venue.contact_first_name,
            lastName: venue.contact_last_name,
            email: venue.contact_email,
            phone: venue.contact_phone,
          },
          status: statusMap[venue.status] || VenueStatus.Inactive,
          orgId: process.env.ORG_ID!,
          createdAt: venue.created_at.getTime() as any,
          updatedAt: venue.created_at.getTime() as any,
          docType: DocType.Venue,
          migrationId: venue.id,
        };
        bulk.push(mongoVenue);
      }
    }
    if (bulk.length > 0) {
      const res = await collection.insertMany(bulk);
      console.log('Venues bulk write: ', JSON.stringify(res, null, 2));
    } 
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}