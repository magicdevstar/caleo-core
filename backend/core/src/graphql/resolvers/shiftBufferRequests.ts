import { Context } from "../../utils/createContext";
import { CreateShiftBufferRequest, DocType, ShiftBufferRequestsSearchInput, ShiftBufferRequest, ShiftBufferRequestStatus } from "../../__generated__/resolvers-types";
import { adminOnly, adminOrOwnerOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { GraphQLError } from "graphql";

export const shiftBufferRequests = {
  Query: {
    shiftBufferRequests: async (
      _parent: unknown,
      { input }: {input: ShiftBufferRequestsSearchInput},
      { shiftBufferRequests, user }: Context
    ): Promise<SearchResults<ShiftBufferRequest>> => {
      adminOnly(user);
      return shiftBufferRequests.search({
        orgId: user?.member.orgId!,
        queryField: 'shiftId',
        ...input,
      });
    },
  },
  Mutation: {
    setShiftBufferStatus: async (
      _parent: unknown,
      { id, status, reason }: { id: string, status: ShiftBufferRequestStatus, reason: string },
      { shiftBufferRequests, shifts, user, organization }: Context
    ): Promise<ShiftBufferRequest> => {
      adminOnly(user);

      const request = await shiftBufferRequests.get(id);
      if (!request) {
        throw new GraphQLError('Shift buffer request not found.');
      }

      // Check that the shift exists and is available
      let shift;
      if (status === ShiftBufferRequestStatus.Approved) {
        shift = await shifts.get(request.shiftId);
        if (!shift) {
          throw new GraphQLError('The shift for this request was not found.');
        }
        if (shift.userId) {
          throw new GraphQLError('The shift for this request was already assigned.');
        }
      }

      const updatedShiftBuffer = {
        ...request,
        status,
        reason,
      };
      await shiftBufferRequests.updateWithNotification({
        request: updatedShiftBuffer,
        shift,
        user: user!,
        organization: organization!,
      });

      // Reject all remaining requests
      await shiftBufferRequests.denyAllOpenShiftBufferRequests({
        shiftId: request.shiftId,
        ignoreIds: [id],
      });

      // Assign user to shift
      if (shift && status === ShiftBufferRequestStatus.Approved) {
        await shifts.update({
          ...shift,
          userId: request.userId,
        });
      }

      return updatedShiftBuffer;
    },
    shiftBufferRequest: async (
      _parent: unknown,
      { shiftBufferRequest }: { shiftBufferRequest: CreateShiftBufferRequest },
      { shiftBufferRequests, shifts, user, organization }: Context
    ): Promise<ShiftBufferRequest> => {
      adminOrOwnerOnly(shiftBufferRequest.userId, user);

      const foundShiftBuffer = await shiftBufferRequests.findOne({
        shiftId: shiftBufferRequest.shiftId,
        userId: user?.id,
        status: ShiftBufferRequestStatus.Pending,
      });

      if (foundShiftBuffer) {
        return foundShiftBuffer;
      }

      const shift = await shifts.get(shiftBufferRequest.shiftId);
      if (!shift) {
        throw new GraphQLError('Shift not found');
      }

      return shiftBufferRequests.createWithNotification({
        shift,
        organization: organization!,
        user: user!,
        shiftBufferRequest,
      });
    },
  },
  fields: {
    ShiftBufferRequest: {
      ...commonResolvers,
      org: (item: ShiftBufferRequest, _, { organizations }: Context) => organizations.loader.load(item.orgId),
      event: (item: ShiftBufferRequest, _, { events }: Context) => events.loader.load(item.eventId),
      assignment: (item: ShiftBufferRequest, _, { assignments }: Context) => assignments.loader.load(item.assignmentId),
      user: (item: ShiftBufferRequest, _, { users }: Context) => users.loader.load(item.userId),
    },
  },
};