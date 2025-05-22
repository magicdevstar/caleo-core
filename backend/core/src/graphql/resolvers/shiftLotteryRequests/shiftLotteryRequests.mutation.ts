import { ObjectId } from "mongodb";
import { GraphQLError } from "graphql/error";
import { Context } from "../../../utils/createContext";
import { adminOnly, adminOrOwnerOnly } from "../../../utils/access";
import { ShiftLotteryRequestStatus, ShiftStatus, UpsertShiftLotteryRequest } from "../../../__generated__/resolvers-types";
import { IShiftLotteryRequest } from "../../../models/shiftLotteryRequest";
import { IShift } from "../../../models/shift";
import logger from "../../../utils/logger";

export const Mutation = {
  removeShiftLotteryRequest: async (
    _parent: unknown,
    { id }: { id: string },
    { shiftLotteryRequests, user }: Context
  ): Promise<string> => {
    const foundRequest = await shiftLotteryRequests.get(id);
    if (!foundRequest) {
      throw new GraphQLError('Lottery Request not found. Please try again.');
    }

    adminOrOwnerOnly(foundRequest.userId.toString(), user);

    await shiftLotteryRequests.remove(id, {
      modifiedById: user._id!,
      status: ShiftLotteryRequestStatus.Removed
    });
    await shiftLotteryRequests.reorderShifts(foundRequest.lotteryCounter, user.id!, id);
    return id;
  },
  shiftLotteryRequest: async (
    _parent: unknown,
    { shiftLotteryRequest }: { shiftLotteryRequest: UpsertShiftLotteryRequest },
    { shiftLotteryRequests, shifts, user, lotteryCounter, organization }: Context
  ): Promise<IShiftLotteryRequest> => {
    adminOrOwnerOnly(shiftLotteryRequest.userId, user);

    const shift = await shifts.collection.findOne<IShift>({
      shiftId: shiftLotteryRequest.shiftGroupId,
      removedAt: { $exists: false },
    });
    if (!shift) {
      throw new GraphQLError('Shift not found');
    }

    const { counter } = await lotteryCounter.get(organization!._id!);
    const highestOrderNumber = await shiftLotteryRequests.highestOrderNumber(counter, user!.id!);
    const upsertObject: IShiftLotteryRequest = {
      status: ShiftLotteryRequestStatus.Pending,
      order: highestOrderNumber + 1,
      ...shiftLotteryRequest,
      shiftGroupId: shift.shiftId,
      eventId: new ObjectId(shift.eventId),
      assignmentId: new ObjectId(shift.assignmentId),
      lotteryCounter: counter,
      orgId: new ObjectId(shift.orgId),
      userId: user._id!,
      modifiedById: user._id!,
      id: shiftLotteryRequest.id || undefined,
    };

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
    const availableShift = await shifts.collection.findOne<IShift>({
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
      orgId: user.member.orgId.toString()!,
      shiftBufferTime: organization.settings?.shiftBuffer.enabled ? organization?.settings?.shiftBuffer.minuteShiftBuffer : 0,
    });

    if (!canSignUpForShift) {
      throw new GraphQLError('User cannot sign up for this shift due to a conflict of availability. Please try again.');
    }
    
    try {
      availableShift.status = ShiftStatus.Assigned;
      availableShift.userId = lottoUser._id!;
      availableShift.modifiedById = user._id!;
      await shifts.update({
        ...availableShift,
        id: availableShift.id!,
      });

      foundRequest.status = ShiftLotteryRequestStatus.Approved;
      foundRequest.modifiedById = user._id!;
      await shiftLotteryRequests.update({
        ...foundRequest,
        id: foundRequest.id!,
      });

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
    }: Context
  ) => {
    adminOnly(user);
    // find assigned slot
    const assignedShift = await shifts.collection.findOne<IShift>({
      shiftId,
      userId: new ObjectId(userId),
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
            modifiedById: user.id!,
          },
          $unset: {
            userId: 1,
          },
        }
      );

      foundRequest.status = ShiftLotteryRequestStatus.Rejected;
      foundRequest.modifiedById = user._id!;
      await shiftLotteryRequests.update({
        ...foundRequest,
        id: foundRequest.id!,
      });

      return true;
    } catch (error) {
      logger.error('Error rejecting lottery assignment', { error });
      throw new GraphQLError('Error rejecting lottery assignment. Please try again.');
    }
  }
};
