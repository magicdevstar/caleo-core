import { ILotteryCounter } from "../../../models/lotteryCounter";
import { commonResolvers } from "../../../utils/common.resolvers";

export const fields = {
  LotteryCounter: {
    ...commonResolvers,
    start: (parent: ILotteryCounter) => parent.start ? parent.start.toISOString() : null,
    end: (parent: ILotteryCounter) => parent.end ? parent.end.toISOString() : null,
  },
};
