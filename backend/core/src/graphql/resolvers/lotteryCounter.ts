import { Context } from "../../utils/createContext";
import { commonResolvers } from "../../utils/common.resolvers";
import { SearchInput } from "../../__generated__/resolvers-types";
import { ILotteryCounter } from "../../models/lotteryCounter";
import { ObjectId } from "mongodb";

export const lotteryCounter = {
  Query: {
    lotteryCounter: (
      _parent: unknown,
      { counter }: { counter?: number },
      { lotteryCounter, user }: Context,
    ) => {
      if (counter) {
        return lotteryCounter.getByCounter(counter, user?.member.orgId!);
      }
      return lotteryCounter.get(user?.member.orgId!);
    },
    lotteryCounters: (
      _parent: unknown,
      { input }: { input: SearchInput },
      { lotteryCounter, user }: Context,
    ) => lotteryCounter.search({
      ...input,
      orgId: new ObjectId(user?.member.orgId!),
      includeRemoved: true,
    }),
  },
  Mutation: {},
  fields: {
    LotteryCounter: {
      ...commonResolvers,
      start: (parent: ILotteryCounter) => parent.start ? parent.start.toISOString() : null,
      end: (parent: ILotteryCounter) => parent.end ? parent.end.toISOString() : null,
    },
  },
};
