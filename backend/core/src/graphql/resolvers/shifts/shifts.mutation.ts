import { GraphQLError } from "graphql";
import { ObjectId } from "mongodb";
import {
  addDays,
  setMilliseconds,
  setSeconds,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Context } from "../../../utils/createContext";
import {
  EventUserActionLogAction,
  EventUserActionLogSource,
  EventUserActionType,
  MemberRole,
  ShiftAdminCheckInOutEvent,
  ShiftCheckInOutEvent,
  ShiftStatus,
  ShiftUpdates,
  UpsertShiftComment,
} from "../../../__generated__/resolvers-types";
import { adminOnly, adminOrOwnerOnly, userIsAdmin } from "../../../utils/access";
import { EventRemoveEventType } from "../../../models/event";
import { MailerEvents } from "../../../types/mailer";
import logger from "../../../utils/logger";
import { IShift, UpsertShiftExtended } from "../../../models/shift";
import { ShiftNotificationType } from "../../../services/notification.service";
import { IEventNotification } from "../../../models/eventNotifications/eventNotifications.entity";
import { DEMOBILIZE } from "../../../models/eventNotifications/eventNotifications.const";

export const Mutation = {
  demobilize: async (
    _parent: unknown,
    { shiftId }: { shiftId: string },
    { shifts, eventUserActions, notificationService, eventNotifications, user, organization }: Context,
  ): Promise<boolean> => {
    adminOnly(user);

    const shiftFilter: any = {
      shiftId,
      userId: {$exists: true},
      removedAt: { $exists: false },
      demobilizedTime: { $exists: false },
    };
    await shifts.collection.updateMany(
      shiftFilter,
      {
        $set: {
          demobilizedTime: new Date(),
          modifiedById: user!._id!,
          updatedAt: new Date(),
        }
      }
    );

    delete shiftFilter.demobilizedTime;
    shiftFilter['shiftCheckInOut.checkOutTime'] = { $exists: false };
    const shiftSlots = await shifts.collection.find<IShift>(shiftFilter).toArray();
    if (shiftSlots.length === 0) {
      return true;
    }
    await eventUserActions.bulk(shiftSlots.map(shift => ({
      userId: shift.userId,
      eventId: shift.eventId,
      shiftGroupId: shift.shiftId,
      actionType: EventUserActionType.Shift,
      source: EventUserActionLogSource.Shift,
      modifiedById: user._id!,
      timestamp: new Date(),
      action: EventUserActionLogAction.Demobilized,
    })));

    await eventNotifications.bulkWrite<IEventNotification>(shiftSlots.map(shift => ({
      title: DEMOBILIZE.title,
      description: DEMOBILIZE.description,
      shiftId: shift._id!,
      orgId: user!.member.orgId,
      modifiedById: user!._id!,
      createdAt: new Date(),
      updatedAt: new Date(),
    })));

    await notificationService.demobilizeNotification({
      organization,
      assignmentId: shiftSlots[0].assignmentId,
      shiftId,
    });

    return true;
  },
  shiftComment: async (
    _parent: unknown,
    { input }: { input: UpsertShiftComment },
    { eventUserActions, shifts, user }: Context
  ): Promise<boolean> => {
    const shift = await shifts.get(input.shiftId);
    if (!shift) {
      throw new GraphQLError("Shift not found");
    }
    await eventUserActions.createItem({
      userId: user._id!,
      eventId: shift.eventId,
      shiftGroupId: shift.shiftId,
      source: EventUserActionLogSource.Shift,
      modifiedById: user._id!,
      timestamp: new Date(),
      action: EventUserActionLogAction.OfficerCommentAdded,
      notes: input.comment,
    });
    return true;
  },
  editCheckInOut: async (
    _parent: unknown,
    {
      input: {
        id,
        callSign,
        checkInTime,
        checkOutTime,
        adminNotes,
        equipmentDetails,
        noShow,
        customShiftId,
        regenerateDocusign,
      }
    }: {
      input: ShiftAdminCheckInOutEvent
    },
    {
      shifts,
      user,
      organization,
      docusign,
      notificationService,
    }: Context
  ): Promise<IShift> => {
    adminOnly(user);
    const shift = await shifts.get(id);
    if (!shift) {
      throw new GraphQLError("Shift not found");
    }

    const response = await shifts.editCheckInOut({
      id,
      callSign,
      checkInTime,
      checkOutTime,
      ...(equipmentDetails?.vehicleCategoryId && { vehicleCategoryId: new ObjectId(equipmentDetails?.vehicleCategoryId) }),
      checkInEquipmentTime: equipmentDetails?.checkInTime,
      checkOutEquipmentTime: equipmentDetails?.checkOutTime,
      adminNotes,
      user: user!,
      noShow: !!noShow,
      customShiftId,
    });

    if (regenerateDocusign) {
      await docusign.resubmitEndOfShiftEnvelope({
        shift: response,
        organization: organization!,
      });
      await notificationService.shiftCheckInOutNotification({
        organization: organization!,
        shift: response!,
        template: MailerEvents.OfficerShiftCheckInOutEdited,
        originalShift: shift,
      });
    }

    return response!;
  },
  checkIn: async (
    _parent: unknown,
    {
      input: {
        id,
        coords,
        time,
        note,
        adminNotes,
        equipmentDateTime,
      }
    }: { input: ShiftCheckInOutEvent },
    { shifts, eventUserActions, user }: Context
  ): Promise<IShift> => {
    const shift = await shifts.get(id);
    if (!shift) {
      throw new GraphQLError("Shift not found");
    }
    adminOrOwnerOnly(shift.userId?.toString() || '', user);
    let finalTime: Date | undefined;
    let finalAdminNote: string | undefined;
    const checkInNote: string | undefined = note || undefined;
    if (userIsAdmin(user)) {
      finalTime = time ? new Date(time) : undefined;
      finalAdminNote = adminNotes || undefined;
    }

    await shifts.checkIn({
      id,
      shift: shift!,
      coords: coords || undefined,
      time: finalTime,
      checkInNote,
      adminNotes: finalAdminNote,
      user: user!,
      equipmentTime: equipmentDateTime || undefined,
    });
    const updatedShift = await shifts.get(id);

    await eventUserActions.createItem({
      userId: updatedShift!.userId!,
      eventId: updatedShift!.eventId,
      shiftGroupId: updatedShift!.shiftId,
      source: EventUserActionLogSource.Shift,
      modifiedById: shift.userId!,
      timestamp: updatedShift!.shiftCheckInOut?.checkInTime || new Date(),
      action: EventUserActionLogAction.CheckIn,
      notes: checkInNote,
    });

    return updatedShift!;
  },
  checkOut: async (
    _parent: unknown,
    {
      input: {
        id,
        coords,
        time,
        note,
        adminNotes,
        vehicleCategoryId,
        equipmentDateTime,
        signNow,
        fromSelfCheckout
      }
    }: { input: ShiftCheckInOutEvent },
    { shifts, docusign, eventUserActions, organization, user }: Context
  ): Promise<{shift: IShift, signingUrl?: string}> => {
    const shift = await shifts.get(id);
    if (!shift) {
      throw new GraphQLError("Shift not found");
    }
    adminOrOwnerOnly(shift.userId!.toString()!, user);
    let finalTime: Date | undefined;
    let finalAdminNote: string | undefined;
    const checkOutNote: string | undefined = note || undefined;
    if (userIsAdmin(user)) {
      finalTime = time ? new Date(time) : undefined;
      finalAdminNote = adminNotes || undefined;
    }
    await shifts.checkOut({
      id,
      coords: coords || undefined,
      time: finalTime,
      checkOutNote,
      adminNotes: finalAdminNote,
      user: user!,
      equipmentTime: equipmentDateTime || undefined,
      ...(vehicleCategoryId && { vehicleCategoryId: new ObjectId(vehicleCategoryId) }),
    });
    const updatedShift = await shifts.get(id);

    const envelope = await docusign.submitEndOfShiftEnvelope({
      shift: updatedShift!,
      organization: organization!,
      signNow: !!signNow,
      fromSelfCheckout: !!fromSelfCheckout,
    });

    await eventUserActions.createItem({
      userId: updatedShift!.userId!,
      eventId: updatedShift!.eventId,
      shiftGroupId: updatedShift!.shiftId,
      source: EventUserActionLogSource.Shift,
      modifiedById: shift.userId!,
      timestamp: updatedShift!.shiftCheckInOut?.checkOutTime || new Date(),
      action: EventUserActionLogAction.CheckOut,
      notes: checkOutNote,
    });

    return {
      shift: updatedShift!,
      signingUrl: envelope?.signingUrl,
    };
  },
  notifyUsersOfShift: async (
    _parent: unknown,
    { shiftId }: { shiftId: string },
    {
      notificationService,
      user,
      organization,
    }: Context
  ): Promise<boolean> => {
    adminOnly(user);
    await notificationService.notifyUsersOfShiftAvailability({
      shiftId,
      organization: organization!
    });
    return true;
  },
  removeShift: async (
    _parent: unknown,
    { id }: { id: string },
    {
      assignments,
      events,
      shifts,
      shiftBufferRequests,
      user,
    }: Context
  ): Promise<string> => {
    adminOnly(user);

    const shift = await shifts.get(id);
    if (!shift) {
      throw new GraphQLError("Shift not found");
    }
    
    await shifts.remove(id, { status: ShiftStatus.Removed });
    
    // Remove shift from assignment
    await assignments.removeShifts(shift.assignmentId, [shift._id!], user!._id!);

    // Remove any shift buffer requests
    await shiftBufferRequests.removeByShiftId(id, user!._id!);
    // TODO: If there are no more shifts then I need to remove all shift interest/lottery requests

    // Update event status or update event start/end time if needed
    await events.updateEvent({
      eventId: shift.eventId,
      removeId: id,
      removeType: EventRemoveEventType.shift,
      orgId: user.member.orgId!,
      removeStart: shift.startTime,
      removeEnd: shift.endTime,
      modifiedById: user!._id!,
    });

    // TODO: Remove shift notifications

    return id;
  },
  removeShifts: async (
    _parent: unknown,
    { shiftId }: { shiftId: string },
    {
      assignments,
      events,
      shifts,
      shiftBufferRequests,
      shiftLotteryRequests,
      user,
    }: Context
  ): Promise<string[]> => {
    adminOnly(user);

    const { items: allShifts } = await shifts.search({
      shiftId,
    });
    if (allShifts.length === 0) {
      throw new GraphQLError("No shifts found");
    }

    await shifts.removeMany({
      shiftId,
      orgId: user.member.orgId!,
    }, {
      status: ShiftStatus.Removed,
      modifiedById: user!._id,
    });

    // Remove from shift
    await assignments.removeShifts(allShifts[0].assignmentId, allShifts.map(({ _id }) => _id!), user!._id!);

    // Remove any shift buffer requests
    await shiftBufferRequests.removeByShiftGroupId(shiftId, user!._id!);
    await shiftLotteryRequests.removeByShiftGroupId(shiftId, user!._id!);
    
    // Set event start/end date
    const eventId = allShifts[0].eventId;
    await events.updateEvent({
      eventId,
      removeId: shiftId,
      removeType: EventRemoveEventType.shifts,
      orgId: user.member.orgId!,
      modifiedById: user!._id!,
    });

    // TODO: Bulk remove shift notifications

    return allShifts.map(({ id }) => id!);
  },
  partialShiftUpdate: async (
    _parent: unknown,
    {
      shiftId,
      updates,
    }: {
      shiftId: string;
      updates: ShiftUpdates;
    },
    {
      user,
      shifts,
      events,
      organization,
      notificationService,
      changeStream,
    }: Context
  ): Promise<string> => {
    adminOnly(user);

    const existingShifts = await shifts.getAllShiftsById(shiftId);
    if (existingShifts.length === 0) {
      throw new GraphQLError('No shifts found');
    }

    // Be sure to re-calculate availability if the start or end time is updated
    const startTime = updates.startTime ? setSeconds(setMilliseconds(new Date(updates.startTime), 0), 0) : existingShifts[0].startTime;
    const endTime = updates.endTime ? setSeconds(setMilliseconds(new Date(updates.endTime), 0), 0) : existingShifts[0].endTime;
    const availability = shifts.createAvailability({
      startTime,
      endTime,
    } as any, organization.timezone!);

    await shifts.updateByShiftGroupId(shiftId, {
      modifiedById: user._id!,
      ...('bypassDemobilization' in updates && { bypassDemobilization: updates.bypassDemobilization }),
      ...((updates.endTime || updates.startTime) && { availability }),
      ...(updates.startTime && { startTime }),
      ...(updates.endTime && { endTime }),
    });

    if (updates.endTime || updates.startTime) {
      await events.updateEvent({
        eventId: new ObjectId(existingShifts[0].eventId),
        removeId: shiftId,
        removeType: EventRemoveEventType.shiftUpdate,
        orgId: user.member.orgId,
        modifiedById: user!._id!,
        lasdEventFields: organization.features.lasdEventFields,
        timezone: organization.timezone,
      });
      await changeStream.handleShift({
        shiftId,
        orgId: user.member.orgId,
        endTime: {
          newValue: endTime,
          oldValue: existingShifts[0].endTime,
        },
        startTime: {
          newValue: startTime,
          oldValue: existingShifts[0].startTime,
        },
      });
    }

    // Update shift reminders if needed
    await notificationService.setOrRemoveShiftReminder({
      shiftId,
      type: ShiftNotificationType.SHIFT_TIME_CHANGED,
    });

    return shiftId;
  },
  shifts: async (
    _parent: unknown,
    { shifts, removeSlots }: { shifts: UpsertShiftExtended[], removeSlots?: boolean },
    {
      organizations,
      assignments,
      events,
      shiftBufferRequests,
      shifts: shiftsModel,
      user,
      interestList,
    }: Context
  ): Promise<IShift[]> => {
    adminOnly(user);

    const organization = await organizations.get(user.member.orgId!);
    if (!organization) {
      throw new GraphQLError("Organization not found");
    }

    for (const shift of shifts) {
      shift.availability = shiftsModel.createAvailability(shift as any, organization.timezone!);
    }

    const assignmentId = shifts[0].assignmentId;
    const eventId = shifts[0].eventId;
    const assignment = await assignments.get(assignmentId);
    if (!assignment) {
      throw new GraphQLError("Assignment not found");
    }

    const event = await events.get(eventId);
    if (!event) {
      throw new GraphQLError("Event not found");
    }

    let highestRefNumber = await shiftsModel.highestRefNumber(shifts[0].eventId);
    const existingShifts = await shiftsModel.search({
      shiftId: shifts[0].shiftId,
      orgId: user.member.orgId!,
    });

    const updatedShifts = shifts.map((shift, index) => {
      const { id, startTime, endTime, ...rest } = shift;
      const foundShift = existingShifts.items.find(({ id: existingId }) => existingId === id);
      let status = foundShift?.status || rest.status;
      let createdById = rest.createdById ? new ObjectId(rest.createdById) : undefined;
      if (!shift.id) {
        createdById = user._id!;
        status = ShiftStatus.Available;
      }
      if (!rest.createdById) {
        createdById = user._id!;
      }
      if (rest.locked) {
        status = ShiftStatus.Locked;
      } else if (!rest.locked && foundShift?.status === ShiftStatus.Locked) {
        status = foundShift && foundShift.userId ? ShiftStatus.Assigned : ShiftStatus.Available;
      }
      if (!shift.refNumber) {
        rest.refNumber = typeof highestRefNumber === 'number' ? ++highestRefNumber : (index + 1);
        rest.customId = rest.customId || `${rest.refNumber}`;
      }
      return {
        ...rest,
        ...(id && { _id: new ObjectId(id) }),
        ...(rest.assignmentId && { assignmentId: new ObjectId(rest.assignmentId) }),
        ...(rest.eventId && { eventId: new ObjectId(rest.eventId) }),
        ...(rest.userId && { userId: new ObjectId(rest.userId) }),
        status,
        orgId: user.member.orgId!,
        startTime: setSeconds(setMilliseconds(new Date(startTime), 0), 0),
        endTime: setSeconds(setMilliseconds(new Date(endTime), 0), 0),
        createdById,
        modifiedById: user.id!,
        updatedAt: new Date(),
      };
    }) as any;

    logger.info('shifts', { updatedShifts });

    const writtenShifts = await shiftsModel.bulkWrite<IShift>(updatedShifts);

    // Add ids to assignment
    const ids = writtenShifts.map(({ id }) => id!);
    await assignments.linkShifts(ids, assignment, user!._id!, removeSlots);

    // Update any shift buffer requests
    const shiftGroupId = updatedShifts[0].shiftId;
    const startTime = updatedShifts[0].startTime;
    const endTime = updatedShifts[0].endTime;
    await shiftBufferRequests.updateByShiftGroupId(shiftGroupId, startTime, endTime, user!._id!);

    // Update event start/end time
    await events.updateEvent({
      eventId: new ObjectId(eventId),
      removeId: shifts[0].shiftId,
      removeType: EventRemoveEventType.shiftUpdate,
      orgId: user.member.orgId,
      modifiedById: user!._id!,
      lasdEventFields: organization?.features.lasdEventFields,
      timezone: organization?.timezone,
    });

    await interestList.maybeTriggerNextAssignment({
      shift: {
        shiftId: shifts[0].shiftId,
        eventId: new ObjectId(eventId),
      } as any,
      organization: organization!,
    });

    // TODO: Bulk update shift notifications

    return writtenShifts;
  },
  shiftAssign: async (
    _parent: unknown,
    { id, userId, note }: { id: string, userId?: string, note?: string },
    {
      shifts,
      shiftBufferRequests,
      users,
      user,
      organization,
      interestList,
      notificationService,
      eventUserActions,
    }: Context
  ): Promise<IShift> => {
    if (userId) {
      adminOrOwnerOnly(userId, user);
    }
    if (userId && userId !== user?.id && !userIsAdmin(user)) {
      throw new GraphQLError("Unauthorized");
    }

    const shift = await shifts.get(id);
    const existingUserId = shift?.userId ? `${shift?.userId}` : null;
    if (!shift || (shift?.locked && userId && !userIsAdmin(user))) {
      throw new GraphQLError("Shift not found");
    }

    if (!userId && shift.userId) {
      adminOrOwnerOnly(shift.userId.toString(), user);
    }

    if (userId && shift.userId && !userIsAdmin(user)) {
      throw new GraphQLError("Shift already assigned");
    }

    // If we are attempting to assign a user we should check if they can sign up for the shift
    if (userId) {
      const assignUser = await users.get(userId!);
      if (!assignUser) {
        throw new GraphQLError("User not found");
      }
      const { canSignUpForShift, requiresShiftBuffer } = await shifts.canSignUpForShift({
        user: assignUser,
        shift,
        orgId: user.member.orgId.toString()!,
        shiftBufferTime: organization?.settings?.shiftBuffer.enabled ? organization?.settings?.shiftBuffer.minuteShiftBuffer : 0,
      });
      if (!canSignUpForShift && !requiresShiftBuffer) {
        throw new GraphQLError("This shift has an overlapping time. Please try another assignment.");
      }
      if (
        !(organization?.settings?.shiftBuffer?.adminOverrideShiftBuffer && userIsAdmin(user!)) &&
        !canSignUpForShift && requiresShiftBuffer && !userIsAdmin(user)
      ) {
        throw new GraphQLError("This shift requires a shift buffer request");
      }
      if (!userIsAdmin(user) && await users.hasMaxShifts({ user: assignUser, shift, organization: organization! })) {
        throw new GraphQLError("The user has reached their maximum shifts for that week");
      }
      if (!userIsAdmin(user) && await users.hasMaxHours({ user: assignUser, shift, organization: organization! })) {
        throw new GraphQLError("The user has reached their maximum hours for the month");
      }
    }

    shift.userId = userId ? new ObjectId(userId) : null;
    const finalStatus = userId ? ShiftStatus.Assigned : shift.locked ? ShiftStatus.Locked : ShiftStatus.Available;
    shift.modifiedById = user._id!;

    const removingShiftUser = !userId && existingUserId;

    let removedShift: IShift | undefined;
    if (removingShiftUser) {
      // Create removed shift
      const {id, _id, ...createShift} = shift;
      let status = ShiftStatus.Relinquished;
      if (existingUserId !== user.id && userIsAdmin(user)) {
        status = ShiftStatus.Unassigned;
      }
      if (
        user?.member?.role !== MemberRole.Admin &&
        status === ShiftStatus.Relinquished &&
        shifts.canRelinquishShift({ shift, organization: organization! })
      ) {
        throw new GraphQLError("You cannot relinquish this shift. Please contact an administrator.");
      }
      removedShift = await shifts.create<IShift>({
        ...createShift,
        relinquishNote: note,
        status,
        modifiedById: user._id!,
        removedAt: new Date(),
        userId: new ObjectId(existingUserId),
      });

      // Remove interest if user relinquished shift
      if (status === ShiftStatus.Relinquished) {
        await interestList.removeInterest({
          modifiedById: user._id!,
          userId: user._id!,
          shiftGroupId: shift.shiftId,
          orgId: user.member.orgId,
        });
      }
    }

    const shiftUpdate = {
      ...(userId && { userId: new ObjectId(userId) }),
      status: finalStatus,
      modifiedById: user!._id!,
      updatedAt: new Date(),
    };
    await shifts.collection.updateOne({
      _id: new ObjectId(id),
    }, {
      $set: shiftUpdate,
      ...(!userId && { $unset: { userId: '' } }),
    });
    const updatedShift: IShift = {
      ...shift,
      ...shiftUpdate,
    };

    let notificationType: ShiftNotificationType | null = null;
    if (userId) {
      // Deny all open requests
      // TODO: Maybe move shift buffer request to another shift slot if one is available
      await shiftBufferRequests.denyAllOpenShiftBufferRequests({
        shiftId: shift.id!,
        modifiedById: user._id!,
      });
      notificationType = user.member.role === MemberRole.Admin && userId !== user.id ?
        ShiftNotificationType.SHIFT_ADMIN_ASSIGNED :
        ShiftNotificationType.SHIFT_USER_ASSIGNED;
    }
    if (removingShiftUser) {
      notificationType = user.id !== existingUserId && userIsAdmin(user) ?
        ShiftNotificationType.SHIFT_ADMIN_REMOVED :
        ShiftNotificationType.SHIFT_USER_REMOVED;
    }

    // Set shift notifications
    await notificationService.shiftAssignmentNotifications({
      organization: organization!,
      user: user!,
      existingUserId,
      shift: {
        ...updatedShift!,
        // Include just incase the shift was removed
        // since the relinquishNote is required for the notification
        relinquishNote: note,
      },
      type: notificationType,
    });

    if (
      !userId &&
      existingUserId &&
      user!.id === existingUserId &&
      !organization?.features?.lasdUserFields &&
      organization?.settings?.userRelinquishShift.enabled
    ) {
      const tier = organization?.settings?.userRelinquishShift?.afterShiftRemove?.tier;
      const days = organization?.settings?.userRelinquishShift?.afterShiftRemove?.days;
      const zonedDate = toZonedTime(new Date(), organization?.timezone || 'America/Los_Angeles' as any);
      const tierUntil =  addDays(zonedDate, days);
      await users.collection.updateOne({
        _id: new ObjectId(existingUserId),
      }, {
        $set: {
          'member.tier': tier,
          'member.tierUntil': tierUntil,
          modifiedById: user._id!,
        },
      });
    }

    if (removingShiftUser) {
      await interestList.maybeTriggerNextAssignment({
        shift: updatedShift!,
        organization: organization!,
        relinquishId: removedShift?._id,
      });

      if (removedShift) {
        await eventUserActions.createItem({
          userId: removedShift.userId!,
          eventId: removedShift.eventId,
          shiftGroupId: removedShift.shiftId,
          source: EventUserActionLogSource.Shift,
          modifiedById: user._id!,
          timestamp: removedShift.removedAt,
          action: removedShift.status as any,
          notes: removedShift.relinquishNote || undefined,
        });
      }
    }

    if (userId && !existingUserId) {
      await eventUserActions.createItem({
        userId: updatedShift.userId!,
        eventId: updatedShift.eventId,
        shiftGroupId: updatedShift.shiftId,
        source: EventUserActionLogSource.Shift,
        modifiedById: user._id!,
        timestamp: updatedShift.updatedAt,
        action: EventUserActionLogAction.Assigned,
      });
    }

    return updatedShift!;
  },
};