import { Context } from "../../utils/createContext";
import {
  CreateShiftBufferRequest,
  ShiftBufferRequestsSearchInput,
  ShiftBufferRequestStatus,
  ShiftStatus,
} from "../../__generated__/resolvers-types";
import { adminOnly, adminOrOwnerOnly, userIsAdmin } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { GraphQLError } from "graphql";
import { IShiftBufferRequest } from "../../models/shiftBufferRequest";
import { ObjectId } from "mongodb";
import { IShift } from "../../models/shift";

export const shiftBufferRequests = {
  Query: {
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
        orgId: user?.member.orgId!,
        queryField: 'shiftId',
        ...searchInput,
      });
    },
  },
  Mutation: {
    removeShiftBufferRequest: async (
      _parent: unknown,
      { id }: { id: string },
      { shiftBufferRequests, user }: Context
    ): Promise<string> => {
      const request = await shiftBufferRequests.get(id);
      if (!request) {
        throw new GraphQLError('Shift buffer request not found.');
      }

      if (request.userId !== user?._id! && !userIsAdmin(user)) {
        throw new GraphQLError('You do not have permission to remove this shift buffer request.');
      }

      await shiftBufferRequests.remove(id, {
        modifiedById: user!._id!,
      });
      return id;
    },
    setShiftBufferStatus: async (
      _parent: unknown,
      { id, status, reason }: { id: string, status: ShiftBufferRequestStatus, reason: string },
      { shiftBufferRequests, shifts, user, organization }: Context
    ): Promise<IShiftBufferRequest> => {
      adminOnly(user);

      const request = await shiftBufferRequests.get(id);
      if (!request) {
        throw new GraphQLError('Shift buffer request not found.');
      }

      // Check that the shift exists and is available
      const shift = await shifts.get(request.shiftId.toString());
      if (!shift) {
        throw new GraphQLError('The shift for this request was not found.');
      }

      if (status === ShiftBufferRequestStatus.Approved) {
        if (shift.userId) {
          throw new GraphQLError('The shift for this request was already assigned.');
        }
      }

      const updatedShiftBuffer = {
        ...request,
        status,
        reason,
        modifiedById: user!._id!,
      };
      await shiftBufferRequests.updateWithNotification({
        request: updatedShiftBuffer,
        shift,
        user: user!,
        organization: organization!,
      });

      // Reject all remaining requests
      await shiftBufferRequests.denyAllOpenShiftBufferRequests({
        shiftId: request.shiftId.toString(),
        ignoreIds: [id],
        modifiedById: user!._id!,
      });

      // Assign user to shift
      if (shift && status === ShiftBufferRequestStatus.Approved) {
        await shifts.update<any>({
          ...shift,
          status: ShiftStatus.Assigned,
          userId: request.userId,
          modifiedById: user!._id!,
        });
      }

      return updatedShiftBuffer;
    },
    shiftBufferRequest: async (
      _parent: unknown,
      { shiftBufferRequest }: { shiftBufferRequest: CreateShiftBufferRequest },
      { shiftBufferRequests, shifts, user, organization }: Context
    ): Promise<IShiftBufferRequest> => {
      adminOrOwnerOnly(shiftBufferRequest.userId, user);

      const foundShiftBuffer: IShiftBufferRequest = await shiftBufferRequests.collection.findOne({
        shiftId: new ObjectId(shiftBufferRequest.shiftId),
        userId: user?._id!,
        status: ShiftBufferRequestStatus.Pending,
        removedAt: { $exists: false },
      }) as unknown as IShiftBufferRequest;

      if (foundShiftBuffer) {
        return foundShiftBuffer;
      }

      const shift = await shifts.get(shiftBufferRequest.shiftId);
      if (!shift) {
        throw new GraphQLError('Shift not found');
      }

      const shiftBufferShift = await shifts.get(shiftBufferRequest.shiftBufferShiftId);
      if (!shiftBufferShift) {
        throw new GraphQLError('Shift buffer shift not found');
      }

      return shiftBufferRequests.createWithNotification({
        shift,
        organization: organization!,
        user: user!,
        shiftBufferShift,
        shiftBufferRequest,
      });
    },
  },
  fields: {
    ShiftBufferRequest: {
      ...commonResolvers,
      startTime: (item: IShiftBufferRequest) => new Date(item.startTime).toISOString(),
      endTime: (item: IShiftBufferRequest) => new Date(item.endTime).toISOString(),
      org: (item: IShiftBufferRequest, _, { organizations }: Context) => organizations.loader.load(item.orgId.toString()),
      event: (item: IShiftBufferRequest, _, { events }: Context) => events.loader.load(item.eventId.toString()),
      assignment: (item: IShiftBufferRequest, _, { assignments }: Context) => assignments.loader.load(item.assignmentId.toString()),
      user: (item: IShiftBufferRequest, _, { users }: Context) => users.loader.load(item.userId.toString()),
      shift: (item: IShiftBufferRequest, _, { shifts }: Context) => shifts.loader.load(item.shiftId.toString()),
      shiftBufferShift: (item: IShiftBufferRequest, _, { shifts }: Context) => shifts.loader.load(item.shiftBufferShiftId.toString()),
    },
  },
};