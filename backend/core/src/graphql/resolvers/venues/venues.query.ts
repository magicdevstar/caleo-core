import { VenueSearchInput } from "../../../__generated__/resolvers-types";
import { IIVenue } from "../../../models/venue";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
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
};
