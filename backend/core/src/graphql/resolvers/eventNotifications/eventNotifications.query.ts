import { EventNotificationSearchInput } from "../../../__generated__/resolvers-types";
import { Context } from "../../../utils/createContext";

export const Query = {
  eventNotifications: async (
    _parent: unknown,
    { input: { eventId, assignmentId, shiftId, ...input } }: { input: EventNotificationSearchInput },
    { eventNotifications, user }: Context,
  ) => {
    const $or = [
      { eventId },
      { assignmentId },
      { shiftId },
    ];
    const res = await eventNotifications.search({
      ...input,
      orgId: user.member.orgId,
      $or,
    });
    return res;
  },
};
