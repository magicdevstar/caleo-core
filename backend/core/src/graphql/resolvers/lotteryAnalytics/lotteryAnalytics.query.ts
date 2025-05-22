import { ObjectId } from "mongodb";
import { userIsAdmin } from "../../../utils/access";
import { Context } from "../../../utils/createContext";

export const Query = {
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
};
