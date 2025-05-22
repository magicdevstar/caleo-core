import { LottoAnalytics, LottoRequests } from "../../../__generated__/resolvers-types";
import { ILottoAnalytics } from "../../../models/analytics";
import { Context } from "../../../utils/createContext";

export const fields = {
  LottoAnalytics: {
    id: (parent: ILottoAnalytics) => parent._id.toString(),
    createdAt: (parent: LottoAnalytics) => new Date(parent.createdAt).toISOString(),
    user: (item: LottoAnalytics, _, { users }: Context) => users.loader.load(item.userId.toString()),
  },
  LottoRequests: {
    event: (item: LottoRequests, _, { events }: Context) => events.loader.load(item.eventId.toString()),
    assignment: (item: LottoRequests, _, { assignments }: Context) => assignments.loader.load(item.assignmentId.toString()),
  },
};
