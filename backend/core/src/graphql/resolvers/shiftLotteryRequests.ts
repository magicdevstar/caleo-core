import { Context } from "../../utils/createContext";
import {
  ShiftLotteryRequest,
  UpsertShiftLotteryRequest
} from "../../__generated__/resolvers-types";
import { adminOrOwnerOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { GraphQLError } from "graphql";
import { ObjectId } from "mongodb";
import logger from "../../utils/logger";

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
      { shiftLotteryRequest: incomingShiftLotteryRequest }: { shiftLotteryRequest: UpsertShiftLotteryRequest },
      { shiftLotteryRequests, shifts, user }: Context
    ): Promise<ShiftLotteryRequest> => {
      const { newId, ...shiftLotteryRequest } = incomingShiftLotteryRequest
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

      let res: ShiftLotteryRequest;
      if (newId) {
        const { id, ...doc } = upsertObject;
        res = await shiftLotteryRequests.create({
          ...doc,
          _id: new ObjectId(id),
        });
      } else {
        res = await shiftLotteryRequests.update(upsertObject, { skipMerge: true }) as ShiftLotteryRequest;
      }
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