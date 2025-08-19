import { EventUserActionSearchInput } from './../../../__generated__/resolvers-types';
import { Context } from '../../../utils/createContext';
import { userIsAdmin } from '../../../utils/access';

export const Query = {
  eventUserActions: async (
    _,
    { input: { cursor, ...input } }: { input: EventUserActionSearchInput },
    { eventUserActions, user }: Context
  ) => {
    // Only allow admins to search by userId
    let userId = user?._id!;
    if (userIsAdmin(user) && input.userId) {
      userId = input.userId;
    }

    return eventUserActions.search({
      ...input,
      ...(cursor ? { _id: { $lt: cursor } } : { }),
      userId,
    });
  },
};
