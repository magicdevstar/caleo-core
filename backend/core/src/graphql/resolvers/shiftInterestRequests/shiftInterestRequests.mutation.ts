import { ObjectId } from "mongodb";
import { GraphQLError } from "graphql/error";
import { Context } from "../../../utils/createContext";
import { adminOnly, adminOrOwnerOnly } from "../../../utils/access";
import { EventUserActionLogAction, EventUserActionLogSource, ShiftInterestRequestStatus, ShiftLotteryRequestStatus, ShiftStatus, UpsertShiftInterestRequest } from "../../../__generated__/resolvers-types";
import { IUpsertShiftInterestRequest } from "../../../models/shiftInterestRequest";
import { IShift } from "../../../models/shift";
import { ShiftNotificationType } from "../../../services/notification.service";
import logger from "../../../utils/logger";

export const Mutation = {
  removeShiftInterestRequest: async (
    _parent: unknown,
    { id }: { id: string },
    { shiftInterestRequests, eventUserActions, user }: Context
  ): Promise<string> => {
    const foundRequest = await shiftInterestRequests.get(id);
    if (!foundRequest) {
      throw new GraphQLError('Shift Request not found. Please try again.');
    }
    adminOrOwnerOnly(foundRequest.userId.toString(), user);
    await shiftInterestRequests.remove(id, { modifiedById: user!._id!, status: ShiftLotteryRequestStatus.Removed });

    await eventUserActions.createItem({
      userId: foundRequest.userId!,
      eventId: foundRequest.eventId!,
      shiftGroupId: foundRequest.shiftGroupId,
      source: EventUserActionLogSource.InterestRequest,
      modifiedById: user._id!,
      timestamp: new Date(),
      action: EventUserActionLogAction.Removed,
    });

    return id;
  },
  shiftInterestRequest: async (
    _parent: unknown,
    { shiftInterestRequest }: { shiftInterestRequest: UpsertShiftInterestRequest },
    {
      shiftInterestRequests,
      shifts,
      users,
      user,
      interestList,
      organization,
      notificationService,
      eventUserActions,
    }: Context
  ): Promise<IUpsertShiftInterestRequest> => {
    adminOrOwnerOnly(shiftInterestRequest.userId, user);

    const shift = await shifts.collection.findOne<IShift>({
      shiftId: shiftInterestRequest.shiftGroupId,
      removedAt: { $exists: false },
    });
    if (!shift) {
      throw new GraphQLError('Shift not found');
    }

    if (
      user.id! === shiftInterestRequest.userId &&
      !shiftInterestRequest.id
    ) {
      const existingRequest = await shiftInterestRequests.getExistingRequest(shiftInterestRequest.userId, shiftInterestRequest.shiftGroupId);
      if (existingRequest) {
        throw new GraphQLError('You already have a pending request for this shift.');
      }
    }

    let notificationPayload: any = null;
    let assignedShiftId: ObjectId | undefined;
    if (shiftInterestRequest.id) {
      // If the status is approved then ensure we add the user to the shift group
      if (shiftInterestRequest.status === ShiftInterestRequestStatus.Approved) {
        try {
          adminOnly(user);
          const availableShifts = await shifts.findAllUnassignedShiftsByGroupId({
            shiftGroupId: shiftInterestRequest.shiftGroupId,
            includeLockedShifts: true,
          });
          let interestUser = user!;
          if (user!.id !== shiftInterestRequest.userId) {
            const foundUser = await users.get(shiftInterestRequest.userId);
            if (!foundUser) {
              throw new GraphQLError('User not found');
            }
            interestUser = foundUser;
          }
          if (availableShifts.length > 0) {
            const slot = availableShifts[0];

            const { canSignUpForShift } = await shifts.canSignUpForShift({
              user: interestUser,
              shift: slot,
              orgId: organization!.id,
              shiftBufferTime: organization?.settings?.shiftBuffer.enabled ? organization?.settings?.shiftBuffer.minuteShiftBuffer : 0,
            });
            const hasMaxHours = await users.hasMaxHours({ user: interestUser, shift: slot, organization: organization! });
            const hasMaxShifts = await users.hasMaxShifts({ user: interestUser, shift: slot, organization: organization! });
            if (!canSignUpForShift || hasMaxShifts || hasMaxHours) {
              throw new GraphQLError('User cannot sign up for this shift');
            }

            const updatedShift = {
              ...slot,
              userId: interestUser._id!,
              status: ShiftStatus.Assigned,
            };

            const finalShift = await shifts.update({
              ...updatedShift,
              id: updatedShift.id!,
            });
            assignedShiftId = updatedShift._id!;

            await eventUserActions.createItem({
              userId: updatedShift.userId!,
              eventId: updatedShift.eventId,
              shiftGroupId: updatedShift.shiftId,
              source: EventUserActionLogSource.Shift,
              modifiedById: user._id!,
              timestamp: finalShift.updatedAt,
              action: EventUserActionLogAction.Assigned,
            });
            await eventUserActions.createItem({
              userId: updatedShift.userId!,
              eventId: updatedShift.eventId,
              shiftGroupId: updatedShift.shiftId,
              source: EventUserActionLogSource.InterestRequest,
              modifiedById: user._id!,
              timestamp: new Date(finalShift.updatedAt.getTime() - 1),
              action: EventUserActionLogAction.Approved,
            });

            notificationPayload = {
              organization,
              user,
              shift: updatedShift,
              type: ShiftNotificationType.SHIFT_ADMIN_ASSIGNED,
            };
          } else {
            throw new GraphQLError('There are no shifts left to assign.');
          }
        } catch(error: GraphQLError | any) {
          if (error instanceof GraphQLError) {
            throw error;
          }
          logger.error('Failed to assign user to shift', { error, shiftInterestRequest });
          throw new GraphQLError('Cannot assign user to this shift');
        }
      }

      // If the status is rejected then ensure we attempt to remove the user from the shift group
      if (shiftInterestRequest.status === ShiftInterestRequestStatus.Rejected) {
        try {
          adminOnly(user);
          let interestUser = user!;
          if (user!.id !== shiftInterestRequest.userId) {
            const foundUser = await users.get(shiftInterestRequest.userId);
            if (!foundUser) {
              throw new GraphQLError('User not found');
            }
            interestUser = foundUser;
          }

          const slot = await shifts.collection.findOne({
            userId: interestUser._id!,
            shiftId: shiftInterestRequest.shiftGroupId,
            status: ShiftStatus.Assigned,
          });
          if (!slot) {
            throw new GraphQLError('User is not assigned to this shift');
          }

          notificationPayload = {
            organization,
            user,
            shift: slot,
            existingUserId: slot.userId,
            type: ShiftNotificationType.SHIFT_ADMIN_REMOVED,
          };

          const {_id, ...createShift} = slot;
          await shifts.create<any>({
            ...createShift,
            status: ShiftStatus.Unassigned,
            modifiedById: user._id!,
            removedAt: new Date(),
            userId: interestUser._id,
          });
          const originalUserId = slot.userId;
          delete slot.userId;
          const finalShift = await shifts.update<any>({
            ...slot,
            id: _id.toString(),
            status: ShiftStatus.Available,
          }, { userId: '' });

          await eventUserActions.createItem({
            userId: originalUserId,
            eventId: finalShift.eventId,
            shiftGroupId: finalShift.shiftId,
            source: EventUserActionLogSource.Shift,
            modifiedById: user._id!,
            timestamp: finalShift.updatedAt,
            action: EventUserActionLogAction.Unassigned,
          });
          await eventUserActions.createItem({
            userId: originalUserId,
            eventId: finalShift.eventId,
            shiftGroupId: finalShift.shiftId,
            source: EventUserActionLogSource.InterestRequest,
            modifiedById: user._id!,
            timestamp: new Date(finalShift.updatedAt.getTime() - 1),
            action: EventUserActionLogAction.Rejected,
          });
        } catch(error) {
          logger.error('Failed to remove user from shift', { error, shiftInterestRequest });
          throw new GraphQLError('Cannot remove user from this shift');
        }
      }
    }

    const upsert: IUpsertShiftInterestRequest = {
      ...(shiftInterestRequest.id ? { id: shiftInterestRequest.id } : {}),
      shiftGroupId: shiftInterestRequest.shiftGroupId,
      ...(shiftInterestRequest.status && {status: shiftInterestRequest.status}),
      ...(shiftInterestRequest.id ? {} : { status: ShiftInterestRequestStatus.Pending }),
      orgId: user.member.orgId!,
      eventId: new ObjectId(shift.eventId),
      ...(assignedShiftId && { assignedShiftId }),
      assignmentId: new ObjectId(shift.assignmentId),
      modifiedById: user._id!,
      userId: new ObjectId(shiftInterestRequest.userId),
    }
    const res = await shiftInterestRequests.upsert(upsert);

    logger.info('Sending notification', { notificationPayload });
    if (notificationPayload) {
      await notificationService.shiftAssignmentNotifications(notificationPayload);
    }

    if (!shiftInterestRequest.id) {
      await eventUserActions.createItem({
        userId: upsert.userId!,
        eventId: upsert.eventId!,
        shiftGroupId: upsert.shiftGroupId,
        source: EventUserActionLogSource.InterestRequest,
        modifiedById: user._id!,
        timestamp: new Date(),
        action: EventUserActionLogAction.Submitted,
      });
    }

    await interestList.maybeTriggerNextAssignment({
      shift: {
        shiftId: upsert.shiftGroupId,
        eventId: upsert.eventId,
      } as any,
      organization: organization!,
    });

    return res;
  },
};
