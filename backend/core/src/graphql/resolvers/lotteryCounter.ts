import { Context } from "../../utils/createContext";
import { commonResolvers } from "../../utils/common.resolvers";

export const lotteryCounter = {
  Query: {
    lotteryCounter: (
      _parent: unknown,
      _args: unknown,
      { lotteryCounter, user }: Context,
    ) => {
      return lotteryCounter.get(user?.member.orgId!);
    },
  },
  Mutation: {},
  fields: {
    LotteryCounter: {
      ...commonResolvers,
    },
  },
};
