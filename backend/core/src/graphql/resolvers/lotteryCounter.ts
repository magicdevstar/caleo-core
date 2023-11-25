import { Context } from "../../utils/createContext";
import { commonResolvers } from "../../utils/common.resolvers";
import { LotteryCounter, SearchInput } from "../../__generated__/resolvers-types";

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
      { lotteryCounter }: Context,
    ) => lotteryCounter.search({
      ...input,
      includeRemoved: true,
    }),
  },
  Mutation: {},
  fields: {
    LotteryCounter: {
      ...commonResolvers,
      start: (parent: LotteryCounter) => parent.start ? new Date(parent.start).toISOString() : null,
      end: (parent: LotteryCounter) => parent.end ? new Date(parent.end).toISOString() : null,
    },
  },
};
