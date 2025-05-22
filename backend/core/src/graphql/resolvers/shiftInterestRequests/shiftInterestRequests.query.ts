import { ShiftInterestRequestsSearchInput, ShiftInterestRequestStatus } from "../../../__generated__/resolvers-types";
import { IShiftInterestRequest } from "../../../models/shiftInterestRequest";
import { adminOnly } from "../../../utils/access";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
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
