import { ObjectId } from "mongodb";
import { GraphQLError } from "graphql/error";
import { Context } from "../../../utils/createContext";
import { adminOnly, adminOrOwnerOnly, userIsAdmin } from "../../../utils/access";
import { CreateShiftBufferRequest, ShiftBufferRequestStatus, ShiftStatus } from "../../../__generated__/resolvers-types";
import { IShiftBufferRequest } from "../../../models/shiftBufferRequest";

export const Mutation = {
  removeShiftBufferRequest: async (
    _parent: unknown,
    { id }: { id: string },
    { shiftBufferRequests, user }: Context
  ): Promise<string> => {
    const request = await shiftBufferRequests.get(id);
    if (!request) {
      throw new GraphQLError('Shift buffer request not found.');
    }

    if (request.userId !== user._id! && !userIsAdmin(user)) {
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
      userId: user._id!,
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
};
