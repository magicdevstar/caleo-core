import { ShiftInterestRequestsSearchInput, ShiftInterestRequestStatus, UserShiftInterestRequestsSearchInput } from "../../../__generated__/resolvers-types";
import { IShiftInterestRequest } from "../../../models/shiftInterestRequest";
import { adminOnly, userIsAdmin } from "../../../utils/access";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
  userShiftInterestRequests: async (
    _parent: unknown,
    { input: { userId: inputUserId } }: { input: UserShiftInterestRequestsSearchInput },
    {
      shiftInterestRequests,
      user,
    }: Context
  ): Promise<SearchResults<IShiftInterestRequest>> => {
    let userId = user._id;
    if (userIsAdmin(user) && inputUserId) {
      userId = inputUserId;
    }
    const searchInput: any = {
      orgId: user?.member.orgId,
      userId,
      status: {
        $in: [
          ShiftInterestRequestStatus.Pending,
          ShiftInterestRequestStatus.Rejected,
        ]
      },
      includeRemoved: true,
      order: 'asc',
      orderBy: 'createdAt',
    };
    return shiftInterestRequests.search(searchInput);
  },
  shiftInterestRequests: async (
    _parent: unknown,
    { input }: { input: ShiftInterestRequestsSearchInput },
    {
      shiftInterestRequests,
      user,
    }: Context
  ): Promise<SearchResults<IShiftInterestRequest>> => {
    adminOnly(user);
    const searchInput: any = {
      orgId: user?.member.orgId,
      shiftGroupId: input.shiftGroupId,
      status: {
        $in: [
          ShiftInterestRequestStatus.Pending,
          ShiftInterestRequestStatus.Approved,
          ShiftInterestRequestStatus.Rejected,
        ]
      },
      includeRemoved: true,
      queryField: 'shiftGroupId',
      order: 'asc',
      orderBy: 'createdAt',
    };
    return shiftInterestRequests.search(searchInput);
  },
};
