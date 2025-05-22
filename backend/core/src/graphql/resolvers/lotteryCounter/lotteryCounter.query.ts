import { ObjectId } from "mongodb";
import { SearchInput } from "../../../__generated__/resolvers-types";
import { Context } from "../../../utils/createContext";

export const Query = {
  lotteryCounter: (
    _parent: unknown,
    { counter }: { counter?: number },
    { lotteryCounter, user }: Context,
  ) => {
    if (counter) {
      return lotteryCounter.getByCounter(counter, user.member.orgId);
    }
    return lotteryCounter.get(user.member.orgId!);
  },
  lotteryCounters: (
    _parent: unknown,
    { input }: { input: SearchInput },
    { lotteryCounter, user }: Context,
  ) => lotteryCounter.search({
    ...input,
    orgId: new ObjectId(user.member.orgId!),
    includeRemoved: true,
  }),
};
