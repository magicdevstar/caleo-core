import { IIVenue } from "../../../models/venue";
import { adminOnly } from "../../../utils/access";
import { Context } from "../../../utils/createContext";

export const Mutation = {
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
};
