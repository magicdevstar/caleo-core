import { GraphQLError } from "graphql";
import { ObjectId } from "mongodb";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import {
  addDays,
  setMilliseconds,
  setSeconds,
} from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { Context } from "../../utils/createContext";
import {
  AvailableShiftsSearchInput,
  EventStatus,
  MemberRole,
  Shift,
  ShiftCheckInOut,
  ShiftCheckInOutEvent,
  ShiftSearchInput,
  ShiftStatus,
  ShiftUpdates,
  UpsertShift,
  UserSearchResult
} from "../../__generated__/resolvers-types";
import { adminOnly, adminOrOwnerOnly, userIsAdmin } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { EventRemoveEventType } from "../../models/event";
import {
  NotificationType,
  ShiftNotificationAction,
  ShiftRemoveNotification,
  ShiftUpsertNotification
} from "../../types/notifications";
import { Action, MailerEvent, MailerEvents } from "../../types/mailer";
import logger from "../../utils/logger";
import { IUserSearchResult } from "../../types/common";
import { IShift, IShiftCheckInOut } from "../../models/shift";

const lambda = new LambdaClient();

export const shift = {
  Query: {
    availableShifts: async (
      _parent: unknown,
      { input: {limit, skip, upcoming } }: {input: AvailableShiftsSearchInput},
      { users, user, organization }: Context
    ): Promise<SearchResults<IShift>> =>
      users.availableShifts({
        user: user!,
        organization: organization!,
        upcoming: !!upcoming,
        eventTypes: [
          EventStatus.FirstComeFirstServe,
          EventStatus.InterestList,
        ],
      }),
    shift: async (
      _parent: unknown,
      { id }: { id: string },
      { shifts }: Context,
    ): Promise<IShift | null> => shifts.get(id),
    groupedShifts: async (
      _parent: unknown,
      { shiftId }: { shiftId: string },
      { shifts, user }: Context,
    ): Promise<IShift[] | null> => {
      const { items } = await shifts.search({
        shiftId,
        orgId: user?.member.orgId!,
        order: 'asc',
        orderBy: 'refNumber',
      });
      return items;
    },
    lotteryShifts: async (
      _parent: unknown,
      _: unknown,
      { users, user, organization }: Context
    ): Promise<SearchResults<IShift>> => users.availableShifts({
      user: user!,
      organization: organization!,
      upcoming: false,
      eventTypes: [EventStatus.ReadyForLottery],
    }),
    shifts: async (
      _parent: unknown,
      { input }: { input: ShiftSearchInput },
      { shifts, user, users }: Context
    ): Promise<SearchResults<IShift>> => {
      const convertedUser = users.convertToModel(user as any);
      return shifts.dynamicSearch({
        orgId: new ObjectId(convertedUser?.member?.orgId!),
        requestingUser: convertedUser!,
        ...input,
      });
    },
    shiftUsers: async (
      _parent: unknown,
      { id, name }: { id: string, name?: string },
      { users, user }: Context
    ): Promise<IUserSearchResult> => {
      adminOnly(user);

      const filters: { name?: string } = {};
      if (name && name.trim() !== '') {
        filters.name = name;
      }

      return users.findCompatibleUsersForShift({
        id,
        orgId: user?.member.orgId!,
        filters,
      });
    }
  },
  Mutation: {
    editCheckInOut: async (
      _parent: unknown,
      {
        input: {
          id,
          checkInTime,
          checkOutTime,
          adminNotes,
        }
      }: {
        input: {
          id: string,
          checkInTime?: string,
          checkOutTime?: string,
          adminNotes?: string,
        }
      },
      { shifts, user, organization }: Context
    ): Promise<IShift> => {
      adminOnly(user);
      const shift = await shifts.get(id);
      if (!shift) {
        throw new GraphQLError("Shift not found");
      }

      await shifts.editCheckInOut({
        id,
        checkInTime,
        checkOutTime,
        adminNotes,
        user: user!,
      });
      const response = await shifts.get(id);

      // Send mailer event
      await lambda.send(new InvokeCommand({
        FunctionName: process.env.MAILER_LAMBDA!,
        InvocationType: 'Event',
        Payload: JSON.stringify({
          action: Action.Email,
          template: MailerEvents.OfficerShiftCheckInOutEdited,
          data: {
            originalShift: shift,
            shift: response!,
            organization,
          }
        } as MailerEvent),
      }));

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
        }
      }: { input: ShiftCheckInOutEvent },
      { shifts, user }: Context
    ): Promise<IShift> => {
      const shift = await shifts.get(id);
      if (!shift) {
        throw new GraphQLError("Shift not found");
      }
      adminOrOwnerOnly(shift.userId?.toString() || '', user);
      let finalTime: Date | undefined;
      let finalAdminNote: string | undefined;
      let checkInNote: string | undefined = note || undefined;
      if (userIsAdmin(user)) {
        finalTime = time ? new Date(time) : undefined;
        finalAdminNote = adminNotes || undefined;
      }

      await shifts.checkIn({
        id,
        coords: coords || undefined,
        time: finalTime,
        checkInNote,
        adminNotes: finalAdminNote,
        user: user!,
      });

      return (await shifts.get(id))!;
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
        }
      }: { input: ShiftCheckInOutEvent },
      { shifts, user }: Context
    ): Promise<IShift> => {
      const shift = await shifts.get(id);
      if (!shift) {
        throw new GraphQLError("Shift not found");
      }
      adminOrOwnerOnly(shift.userId?.toString()!, user);
      let finalTime: Date | undefined;
      let finalAdminNote: string | undefined;
      let checkOutNote: string | undefined = note || undefined;
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
      });

      return (await shifts.get(id))!;
    },
    notifyUsersOfShift: async (
      _parent: unknown,
      { shiftId }: { shiftId: string },
      {
        shifts,
        user,
        organization,
      }: Context
    ): Promise<boolean> => {
      adminOnly(user);
      await shifts.notifyUsersOfShiftAvailability(shiftId, organization!);
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
        user
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
      // TODO: If there are no more shifts then I need to remove all shift lottery requests

      // Update event status or update event start/end time if needed
      await events.updateEvent({
        eventId: shift.eventId,
        removeId: id,
        removeType: EventRemoveEventType.shift,
        orgId: user?.member.orgId!,
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
        orgId: user?.member.orgId!,
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
        orgId: user?.member.orgId!,
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
      }: Context
    ): Promise<string> => {
      adminOnly(user);

      const existingShifts = await shifts.getAllShiftsById(shiftId);
      if (existingShifts.length === 0) {
        throw new GraphQLError('No shifts found');
      }

      await shifts.updateByShiftGroupId(shiftId, {
        modifiedById: user?._id!,
        ...(updates.startTime && { startTime: setSeconds(setMilliseconds(new Date(updates.startTime), 0), 0) }),
        ...(updates.endTime && { endTime: setSeconds(setMilliseconds(new Date(updates.endTime), 0), 0) }),
      });

      return shiftId;
    },
    shifts: async (
      _parent: unknown,
      { shifts }: { shifts: UpsertShift[] },
      {
        organizations,
        assignments,
        events,
        shiftBufferRequests,
        shifts: shiftsModel,
        user,
      }: Context
    ): Promise<IShift[]> => {
      adminOnly(user);

      const organization = await organizations.get(user?.member.orgId!);
      const availability = shiftsModel.createAvailability(shifts[0] as any, organization?.timezone!);
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
        orgId: user?.member.orgId!,
      });

      const updatedShifts = shifts.map((shift, index) => {
        const { id, startTime, endTime, ...rest } = shift;
        const foundShift = existingShifts.items.find(({ id: existingId }) => existingId === id);
        let status = foundShift?.status || rest.status;
        let createdById = rest.createdById ? new ObjectId(rest.createdById) : undefined;
        if (!shift.id) {
          createdById = user?._id!;
          status = ShiftStatus.Available;
        }
        if (!rest.createdById) {
          createdById = user?._id!;
        }
        if (rest.locked) {
          status = ShiftStatus.Locked;
        } else if (!rest.locked && rest.status === ShiftStatus.Locked) {
          status = foundShift && foundShift.userId ? ShiftStatus.Assigned : ShiftStatus.Available;
        }
        if (!shift.refNumber) {
          rest.refNumber = typeof highestRefNumber === 'number' ? ++highestRefNumber : (index + 1);
        }
        return {
          ...rest,
          ...(id && { _id: new ObjectId(id) }),
          ...(rest.assignmentId && { assignmentId: new ObjectId(rest.assignmentId) }),
          ...(rest.eventId && { eventId: new ObjectId(rest.eventId) }),
          ...(rest.userId && { userId: new ObjectId(rest.userId) }),
          status,
          availability,
          orgId: user?.member.orgId!,
          startTime: setSeconds(setMilliseconds(new Date(startTime), 0), 0),
          endTime: setSeconds(setMilliseconds(new Date(endTime), 0), 0),
          createdById,
          modifiedById: user?.id!,
          updatedAt: new Date(),
        };
      }) as any;

      logger.info('shifts', { updatedShifts });

      const writtenShifts = await shiftsModel.bulkWrite<IShift>(updatedShifts);

      // Add ids to assignment
      const ids = writtenShifts.map(({ id }) => id!);
      await assignments.linkShifts(ids, assignment, user!._id!);

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
        orgId: user?.member.orgId!,
        modifiedById: user!._id!,
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
      if (!shift) {
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
          orgId: user?.member.orgId.toString()!,
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
      shift.status = userId ? ShiftStatus.Assigned : ShiftStatus.Available;
      shift.modifiedById = user?._id!;

      const removingShiftUser = !userId && existingUserId;

      let removedShift: IShift;
      if (removingShiftUser) {
        // Create removed shift
        const {id, _id, ...createShift} = shift;
        let status = ShiftStatus.Relinquished;
        if (existingUserId !== user!.id && userIsAdmin(user)) {
          status = ShiftStatus.Unassigned;
        }
        removedShift = await shifts.create<IShift>({
          ...createShift,
          relinquishNote: note,
          status,
          modifiedById: user?._id!,
          removedAt: new Date(),
          userId: new ObjectId(existingUserId),
        });
      }

      const shiftUpdate = {
        ...(userId && { userId: new ObjectId(userId) }),
        status: userId ? ShiftStatus.Assigned : ShiftStatus.Available,
        modifiedById: user!._id!,
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


      if (userId) {
        // Deny all open requests
        // TODO: Maybe move shift buffer request to another shift slot if one is available
        await shiftBufferRequests.denyAllOpenShiftBufferRequests({
          shiftId: shift.id!,
          modifiedById: user?._id!,
        });
        // Scheduler reminder notification
        await lambda.send(new InvokeCommand({
          FunctionName: process.env.SHIFT_NOTIFICATION_SCHEDULER,
          InvocationType: 'Event',
          Payload: JSON.stringify({
            type: NotificationType.Shift,
            action: ShiftNotificationAction.UpsertNotification,
            id: shift.id,
          } as ShiftUpsertNotification),
        }));
        // Send assignment notification
        await lambda.send(new InvokeCommand({
          FunctionName: process.env.MAILER_LAMBDA!,
          InvocationType: 'Event',
          Payload: JSON.stringify({
            action: Action.Email,
            template: MailerEvents.OfficerAdminAssignedShift,
            data: {
              adminAssignedShift: user?.member.role === MemberRole.Admin && userId !== user?.id,
              shift: updatedShift!,
              organization,
            }
          } as MailerEvent),
        }));
      }
      if (!userId && existingUserId) {
        // Remove scheduled event
        await lambda.send(new InvokeCommand({
          FunctionName: process.env.SHIFT_NOTIFICATION_SCHEDULER,
          InvocationType: 'Event',
          Payload: JSON.stringify({
            type: NotificationType.Shift,
            action: ShiftNotificationAction.RemoveNotification,
            id: shift.id,
          } as ShiftRemoveNotification),
        }));

        const template = user!.id !== existingUserId && userIsAdmin(user) ?
          MailerEvents.OfficerRemovedFromShift :
          MailerEvents.AdminShiftRelinquished;

        // Send unassignment notification
        await lambda.send(new InvokeCommand({
          FunctionName: process.env.MAILER_LAMBDA!,
          InvocationType: 'Event',
          Payload: JSON.stringify({
            action: Action.Email,
            template,
            data: {
              shift: removedShift!,
              existingUserId,
              removeUser: user,
              organization,
            }
          } as MailerEvent),
        }));
      }
      if (
        !userId &&
        existingUserId &&
        user!.id === existingUserId &&
        organization?.settings?.userRelinquishShift.enabled
      ) {
        const tier = organization?.settings?.userRelinquishShift?.afterShiftRemove?.tier;
        const days = organization?.settings?.userRelinquishShift?.afterShiftRemove?.days;
        const zonedDate = utcToZonedTime(new Date(), organization?.timezone || 'America/Los_Angeles' as any);
        const tierUntil =  addDays(zonedDate, days);
        await users.collection.updateOne({
          _id: new ObjectId(existingUserId),
        }, {
          $set: {
            'member.tier': tier,
            'member.tierUntil': tierUntil,
            modifiedById: user?._id!,
          },
        });
      }

      return updatedShift!;
    }
  },
  fields: {
    Shift: {
      ...commonResolvers,
      createdBy: (shift: IShift, _, { users }: Context) => shift.createdById ? users.loader.load(shift.createdById.toString()) : null,
      org: (shift: IShift, _, { organizations }: Context) => organizations.loader.load(shift.orgId.toString()),
      event: (shift: IShift, _, { events }: Context) => events.loader.load(shift.eventId.toString()),
      assignment: (shift: IShift, _, { assignments }: Context) => assignments.loader.load(shift.assignmentId.toString()),
      startTime: (item: IShift) => new Date(item.startTime).toISOString(),
      endTime: (item: IShift) => new Date(item.endTime).toISOString(),
      user: (shift: IShift, _, { users }: Context) => shift.userId ? users.loader.load(shift.userId.toString()) : null,
      shiftInterestRequest: (shift: IShift, _, { shiftInterestRequests, user, organization }: Context) =>
        shiftInterestRequests.requestLoader.load({
          userId: user?.id!,
          orgId: organization?.id!,
          shiftGroupId: shift.shiftId,
        }),
      lotteryRequest: (shift: IShift, _, { shiftLotteryRequests, user, organization }: Context) =>
        shiftLotteryRequests.requestLoader.load({
          userId: user?.id!,
          orgId: organization?.id!,
          shiftGroupId: shift.shiftId,
        }),
      otherShiftSlots: (
        shift: IShift,
        _,
        { shifts }: Context
      ) => shifts.loadOtherShiftSlots.load(shift.shiftId),
    },
    ShiftCheckInOut: {
      checkInTime: (item: IShiftCheckInOut) => item.checkInTime ? new Date(item.checkInTime).toISOString() : null,
      checkOutTime: (item: IShiftCheckInOut) => item.checkOutTime ? new Date(item.checkOutTime).toISOString() : null,
    }
  },
};
