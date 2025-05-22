import { IIVenue, IVenueContract } from "../../../models/venue";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  Venue: {
    ...commonResolvers,
    org: (venue: IIVenue, _, { organizations }: Context) => organizations.loader.load(venue.orgId.toString()),
  },
  VenueContract: {
    expirationDate: (contract: IVenueContract) => contract.expirationDate ? contract.expirationDate.toISOString() : null,
  },
};
