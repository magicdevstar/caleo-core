import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import {
  ShiftLotteryRequest,
  ShiftLotteryRequestStatus,
  ShiftLotteryRequestsSearchInput,
  UpsertShiftLotteryRequest
} from "../../__generated__/resolvers-types";
import { adminOrOwnerOnly, userIsAdmin } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import logger from "../../utils/logger";

export const shiftLotteryRequests = {
  Query: {
    shiftLotteryRequests: async (
      _parent: unknown,
      { input }: { input: ShiftLotteryRequestsSearchInput },
      {
        shiftLotteryRequests,
        user,
      }: Context
    ): Promise<SearchResults<ShiftLotteryRequest>> => {
      let searchInput: any = {
        orgId: user?.member.orgId!,
        userId: user?.id,
        queryField: 'shiftGroupId',
        order: 'asc',
        orderBy: 'order',
      };
      if (input && userIsAdmin(user)) {
        const { counters, ...rest } = input;
        searchInput = {
          ...searchInput,
          ...rest,
        } as any;
        if (counters) {
          searchInput.lotteryCounter = {
            $in: counters,
          };
        }
      }
      return shiftLotteryRequests.search(searchInput);
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

      await shiftLotteryRequests.remove(id, { modifiedById: user?.id });

      return id;
    },
    shiftLotteryRequest: async (
      _parent: unknown,
      { shiftLotteryRequest }: { shiftLotteryRequest: UpsertShiftLotteryRequest },
      { shiftLotteryRequests, shifts, user, lotteryCounter, organization }: Context
    ): Promise<ShiftLotteryRequest> => {
      adminOrOwnerOnly(shiftLotteryRequest.userId, user);

      const shift = await shifts.findOne({
        shiftId: shiftLotteryRequest.shiftGroupId,
        removedAt: { $exists: false },
      });
      if (!shift) {
        throw new GraphQLError('Shift not found');
      }

      const { counter } = await lotteryCounter.get(organization!.id);
      const highestOrderNumber = await shiftLotteryRequests.highestOrderNumber(counter, user!.id);
      const upsertObject = {
        status: ShiftLotteryRequestStatus.Pending,
        order: highestOrderNumber,
        ...shiftLotteryRequest,
        shiftGroupId: shift.shiftId,
        eventId: shift.eventId,
        assignmentId: shift.assignmentId,
        lotteryCounter: counter,
        orgId: shift.orgId,
        userId: user?.id!,
        modifiedById: user?.id!,
      } as any;

      const res = await shiftLotteryRequests.upsert(upsertObject);
      logger.info('Upsert Res', { res });

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
      shift: (item: ShiftLotteryRequest, _, { shifts }: Context) => shifts.loadOneShiftFromGroup.load(item.shiftGroupId),
    },
  },
};