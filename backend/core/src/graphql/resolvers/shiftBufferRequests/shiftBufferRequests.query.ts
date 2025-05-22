import { ObjectId } from "mongodb";
import { ShiftBufferRequestsSearchInput } from "../../../__generated__/resolvers-types";
import { IShiftBufferRequest } from "../../../models/shiftBufferRequest";
import { adminOnly, adminOrOwnerOnly } from "../../../utils/access";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
  shiftBufferRequests: async (
    _parent: unknown,
    { input }: {input: ShiftBufferRequestsSearchInput},
    { shiftBufferRequests, user }: Context
  ): Promise<SearchResults<IShiftBufferRequest>> => {
    const { startTime, endTime, userId, ...searchInput } = input;

    if (userId) {
      adminOrOwnerOnly(userId, user);
      (searchInput as any).userId = new ObjectId(userId);
    } else {
      adminOnly(user);
    }

    if (startTime) {
      (searchInput as any).endTime = {
        $gte: new Date(startTime),
      };
    } else if (endTime) {
      (searchInput as any).startTime = {
        $lte: new Date(endTime),
      };
    }

    return shiftBufferRequests.search({
      orgId: user.member.orgId!,
      queryField: 'shiftId',
      ...searchInput,
    });
  },
};
