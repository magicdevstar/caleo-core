import { Context } from "../../utils/createContext";
import { LottoAnalytics, LottoRequests } from "../../__generated__/resolvers-types";
import { ILottoAnalytics } from "../../models/analytics";
import { userIsAdmin } from "../../utils/access";
import { ObjectId } from "mongodb";

export const lotteryAnalytics = {
  Query: {
    lottoAnalytics: async (
      _parent: unknown,
      { userId }: { userId: string },
      {
        lotteryCounter,
        analytics,
        user
      }: Context,
    ) => {
      const uId = userId && userIsAdmin(user) ? userId : user.id!;
      const currentCounter = await lotteryCounter.get(new ObjectId(user.member.orgId!));
      return analytics.getUserLottoAnalytics({
        userId: uId,
        lotteryCounter: currentCounter.counter - 1,
      });
    },
  },
  Mutation: {},
  fields: {
    LottoAnalytics: {
      id: (parent: ILottoAnalytics) => parent._id.toString(),
      createdAt: (parent: LottoAnalytics) => new Date(parent.createdAt).toISOString(),
      user: (item: LottoAnalytics, _, { users }: Context) => users.loader.load(item.userId.toString()),
    },
    LottoRequests: {
      event: (item: LottoRequests, _, { events }: Context) => events.loader.load(item.eventId.toString()),
      assignment: (item: LottoRequests, _, { assignments }: Context) => assignments.loader.load(item.assignmentId.toString()),
    },
  },
};
