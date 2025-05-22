import { ObjectId } from "mongodb";
import { ShiftLotteryRequestsSearchInput, ShiftLotteryRequestStatus, ShiftLottoRequestsSearchInput } from "../../../__generated__/resolvers-types";
import { IShiftLotteryRequest } from "../../../models/shiftLotteryRequest";
import { adminOnly, userIsAdmin } from "../../../utils/access";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
  shiftLottoRequests: async (
    _parent: unknown,
    { input }: { input: ShiftLottoRequestsSearchInput },
    {
      user,
      shiftLotteryRequests,
    }: Context
  ): Promise<SearchResults<IShiftLotteryRequest>> => {
    adminOnly(user);
    return shiftLotteryRequests.search({
      ...input,
      status: {
        $in: [ShiftLotteryRequestStatus.Approved, ShiftLotteryRequestStatus.Rejected],
      },
      includeRemoved: true,
    });
  },
  shiftLotteryRequests: async (
    _parent: unknown,
    { input }: { input: ShiftLotteryRequestsSearchInput },
    {
      shiftLotteryRequests,
      user,
      lotteryCounter,
      organization,
    }: Context
  ): Promise<SearchResults<IShiftLotteryRequest>> => {
    let searchInput: any = {
      orgId: user.member.orgId!,
      ...(user._id && {userId: new ObjectId(user._id!)}),
      queryField: 'shiftGroupId',
      order: 'asc',
      orderBy: 'order',
    };
    if (input && userIsAdmin(user)) {
      const { counters, ...rest } = input;
      searchInput = {
        ...searchInput,
        ...rest,
        ...(rest.userId && {userId: new ObjectId(rest.userId)}),
      } as any;
      if (counters) {
        searchInput.lotteryCounter = {
          $in: counters,
        };
      }
    }
    if (!userIsAdmin(user)) {
      const { counter } = await lotteryCounter.get(organization!._id!);
      searchInput.lotteryCounter = {
        $in: [counter],
      };
    }
    return shiftLotteryRequests.search(searchInput);
  },
};
