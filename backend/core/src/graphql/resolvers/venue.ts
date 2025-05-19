import { Context } from "../../utils/createContext";
import { VenueSearchInput } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { IIVenue, IVenueContract } from "../../models/venue";

export const venue = {
  Query: {
    venue: async (
      _parent: unknown,
      { id }: { id: string },
      { venues }: Context,
    ): Promise<IIVenue | null> => venues.get(id),
    venues: async (
      _parent: unknown,
      { input: { status, ...rest } }: { input: VenueSearchInput },
      { venues, user }: Context
    ): Promise<SearchResults<IIVenue>> => venues.search({
      orgId: user?.member.orgId,
      queryField: 'name',
      ...(status && { status: { $in: status } }),
      ...rest,
    })
  },
  Mutation: {
    removeVenue: async (
      _parent: unknown,
      { id }: { id: string },
      { venues, user }: Context
    ): Promise<string> => {
      adminOnly(user);
      await venues.remove(id, {
        modifiedById: user!._id!,
      });
      return id;
    },
    venue: async (
      _parent: unknown,
      { venue }: { venue: IIVenue },
      { venues, user }: Context
    ): Promise<IIVenue> => {
      adminOnly(user);

      if (venue.contract?.expirationDate) {
        venue.contract.expirationDate = new Date(venue.contract.expirationDate);
      }

      return venues.upsert({
        ...venue,
        orgId: user.member.orgId,
        modifiedById: user!._id!,
      });
    },
  },
  fields: {
    Venue: {
      ...commonResolvers,
      org: (venue: IIVenue, _, { organizations }: Context) => organizations.loader.load(venue.orgId.toString()),
    },
    VenueContract: {
      expirationDate: (contract: IVenueContract) => contract.expirationDate ? contract.expirationDate.toISOString() : null,
    },
  },
};
