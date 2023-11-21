import { Context } from "../../utils/createContext";
import { Venue, UpsertVenue, VenueSearchInput } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";

export const venue = {
  Query: {
    venue: async (
      _parent: unknown,
      { id }: { id: string },
      { venues }: Context,
    ): Promise<Venue | null> => venues.get(id),
    venues: async (
      _parent: unknown,
      { input: { status, ...rest } }: { input: VenueSearchInput },
      { venues, user }: Context
    ): Promise<SearchResults<Venue>> => venues.search({
      orgId: user?.member.orgId!,
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
        modifiedById: user!.id,
      });
      return id;
    },
    venue: async (
      _parent: unknown,
      { venue }: { venue: UpsertVenue },
      { venues, user }: Context
    ): Promise<Venue> => {
      adminOnly(user);
      return venues.upsert({
        ...venue,
        orgId: user?.member.orgId!,
        modifiedById: user!.id,
      } as any);
    },
  },
  fields: {
    Venue: {
      ...commonResolvers,
      org: (venue: Venue, _, { organizations }: Context) => organizations.loader.load(venue.orgId),
    },
  },
};
