import { Context } from "../..";
import {
  ShiftLotteryRequest,
  UpsertShiftLotteryRequest
} from "../../__generated__/resolvers-types";
import { adminOrOwnerOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { GraphQLError } from "graphql";

export const shiftLotteryRequests = {
  Query: {
    shiftLotteryRequests: async (
      _parent: unknown,
      _args: unknown,
      { shiftLotteryRequests, user }: Context
    ): Promise<SearchResults<ShiftLotteryRequest>> => {
      return shiftLotteryRequests.search({
        orgId: user?.member.orgId!,
        userId: user?.id,
        queryField: 'shiftGroupId',
        order: 'asc',
        orderBy: 'order',
      });
    },
  },
  Mutation: {
    removeShiftLotteryRequest: async (
      _parent: unknown,
      { id }: { id: string },
      { shiftLotteryRequests, user }: Context
    ): Promise<string> => {
      const foundRequest = await shiftLotteryRequests.get(id);
      if (!foundRequest) {
        throw new GraphQLError('Lottery Request not found. Please try again.');
      }

      adminOrOwnerOnly(foundRequest.userId, user);

      await shiftLotteryRequests.remove(id);

      return id;
    },
    shiftLotteryRequest: async (
      _parent: unknown,
      { shiftLotteryRequest }: { shiftLotteryRequest: UpsertShiftLotteryRequest },
      { shiftLotteryRequests, shifts, user }: Context
    ): Promise<ShiftLotteryRequest> => {
      adminOrOwnerOnly(shiftLotteryRequest.userId, user);

      const shift = await shifts.findOne({
        shiftId: shiftLotteryRequest.shiftGroupId,
      });
      if (!shift) {
        throw new GraphQLError('Shift not found');
      }

      const upsertObject = {
        ...shiftLotteryRequest,
        shiftGroupId: shift.shiftId,
        eventId: shift.eventId,
        assignmentId: shift.assignmentId,
        orgId: shift.orgId,
        userId: user?.id!,
      } as any;

      const res = await shiftLotteryRequests.upsert(upsertObject) as ShiftLotteryRequest;

      return res;
    },
  },
  fields: {
    ShiftLotteryRequest: {
      ...commonResolvers,
      org: (item: ShiftLotteryRequest, _, { organizations }: Context) => organizations.loader.load(item.orgId),
      event: (item: ShiftLotteryRequest, _, { events }: Context) => events.loader.load(item.eventId),
      assignment: (item: ShiftLotteryRequest, _, { assignments }: Context) => assignments.loader.load(item.assignmentId),
      user: (item: ShiftLotteryRequest, _, { users }: Context) => users.loader.load(item.userId),
    },
  },
};