import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import {
  ShiftLotteryRequest,
  ShiftLotteryRequestStatus,
  ShiftLotteryRequestsSearchInput,
  ShiftLottoRequestsSearchInput,
  ShiftStatus,
  UpsertShiftLotteryRequest
} from "../../__generated__/resolvers-types";
import { adminOnly, adminOrOwnerOnly, userIsAdmin } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import logger from "../../utils/logger";
import { ObjectId } from "mongodb";

export const shiftLotteryRequests = {
  Query: {
    shiftLottoRequests: async (
      _parent: unknown,
      { input }: { input: ShiftLottoRequestsSearchInput },
      {
        user,
        shiftLotteryRequests,
      }: Context
    ): Promise<SearchResults<ShiftLotteryRequest>> => {
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
      if (!userIsAdmin(user)) {
        const { counter } = await lotteryCounter.get(organization!.id);
        searchInput.lotteryCounter = {
          $in: [counter],
        };
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

      await shiftLotteryRequests.remove(id, { modifiedById: user?.id, status: ShiftLotteryRequestStatus.Removed });
      await shiftLotteryRequests.reorderShifts(foundRequest.lotteryCounter, user?.id!, id);
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
        order: highestOrderNumber + 1,
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
    approveLottoAssignment: async (
      _parent: unknown,
      { id, shiftId, userId }: { id: string, shiftId: string, userId: string },
      {
        shiftLotteryRequests,
        shifts,
        users,
        user,
        organization,
      }: Context
    ) => {
      adminOnly(user);
      // find available slot
      const availableShift = await shifts.findOne({
        shiftId,
        status: ShiftStatus.Available,
        removedAt: { $exists: false },
      });

      // find lottery request
      const foundRequest = await shiftLotteryRequests.get(id, { removed: true });

      // find user
      const lottoUser = await users.get(userId);

      if (!lottoUser) {
        throw new GraphQLError('User not found. Please try again.');
      }

      if (!foundRequest) {
        throw new GraphQLError('Lottery Request not found. Please try again.');
      }

      if (!availableShift) {
        throw new GraphQLError('There is no available shift for this shift group. Please unassign someone else before approving this request.');
      }

      const { canSignUpForShift } = await shifts.canSignUpForShift({
        user: lottoUser,
        shift: availableShift,
        orgId: user?.member.orgId!,
        shiftBufferTime: organization?.settings?.shiftBuffer.enabled ? organization?.settings?.shiftBuffer.minuteShiftBuffer : 0,
      });

      if (!canSignUpForShift) {
        throw new GraphQLError('User cannot sign up for this shift due to a conflict of availability. Please try again.');
      }
      
      try {
        availableShift.status = ShiftStatus.Assigned;
        availableShift.userId = lottoUser.id;
        availableShift.modifiedById = user?.id!;
        await shifts.update(availableShift, { skipMerge: true });

        foundRequest.status = ShiftLotteryRequestStatus.Approved;
        foundRequest.modifiedById = user?.id!;
        await shiftLotteryRequests.update(foundRequest, { skipMerge: true });

        return true;
      } catch (error) {
        logger.error('Error approving lottery assignment', { error });
        throw new GraphQLError('Error approving lottery assignment. Please try again.');
      }
    },
    rejectLottoAssignment: async (
      _parent: unknown,
      { id, shiftId, userId }: { id: string, shiftId: string, userId: string },
      {
        shiftLotteryRequests,
        shifts,
        users,
        user,
        organization,
      }: Context
    ) => {
      adminOnly(user);
      // find assigned slot
      const assignedShift = await shifts.findOne({
        shiftId,
        userId,
        status: ShiftStatus.Assigned,
        removedAt: { $exists: false },
      });

      // find lottery request
      const foundRequest = await shiftLotteryRequests.get(id, { removed: true });

      // find user
      const lottoUser = await users.get(userId);

      if (!lottoUser) {
        throw new GraphQLError('User not found. Please try again.');
      }

      if (!foundRequest) {
        throw new GraphQLError('Lottery Request not found. Please try again.');
      }

      if (!assignedShift) {
        throw new GraphQLError('There is no assigned shift for this user in this shift group. Please reload and try again.');
      }

      try {
        await shifts.collection.updateOne(
          {
            _id: new ObjectId(assignedShift.id),
          },
          {
            $set: {
              status: ShiftStatus.Available,
              modifiedById: user?.id!,
            },
            $unset: {
              userId: 1,
            },
          }
        );

        foundRequest.status = ShiftLotteryRequestStatus.Rejected;
        foundRequest.modifiedById = user?.id!;
        await shiftLotteryRequests.update(foundRequest, { skipMerge: true });

        return true;
      } catch (error) {
        logger.error('Error rejecting lottery assignment', { error });
        throw new GraphQLError('Error rejecting lottery assignment. Please try again.');
      }
    }
  },
  fields: {
    ShiftLotteryRequest: {
      ...commonResolvers,
      org: (item: ShiftLotteryRequest, _, { organizations }: Context) => organizations.loader.load(item.orgId),
      event: (item: ShiftLotteryRequest, _, { events }: Context) => events.loader.load(item.eventId),
      assignment: (item: ShiftLotteryRequest, _, { assignments }: Context) => assignments.loader.load(item.assignmentId),
      user: async (item: ShiftLotteryRequest, {shiftStart, timezoneOffset}: {shiftStart: string; timezoneOffset: number;}, { users }: Context) => {
        const user = await users.loader.load(item.userId);
        return {
          ...user,
          shiftStart,
          timezoneOffset,
        };
      },
      shift: (item: ShiftLotteryRequest, _, { shifts }: Context) => shifts.loadOneShiftFromGroup.load(item.shiftGroupId),
    },
  },
};