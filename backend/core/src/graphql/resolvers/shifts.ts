import { GraphQLError } from "graphql";
import { ObjectId } from "mongodb";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import {
  addDays,
  format,
  setMilliseconds,
  setSeconds,
} from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { Context } from "../../utils/createContext";
import {
  AvailableShiftsSearchInput,
  EventStatus,
  MemberRole,
  MemberTier,
  Shift,
  ShiftSearchInput,
  ShiftStatus,
  UpsertShift,
  UserSearchResult
} from "../../__generated__/resolvers-types";
import { adminOnly, adminOrOwnerOnly, userIsAdmin } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { EventRemoveEventType } from "../../models/event";
import { ScheduleEvent } from "../../models/scheduler";
import {
  NotificationType,
  ShiftNotificationAction,
  ShiftRemoveNotification,
  ShiftUpsertNotification
} from "../../types/notifications";
import { Action, MailerEvent, MailerEvents } from "../../types/mailer";
import logger from "../../utils/logger";

const lambda = new LambdaClient();

export const shift = {
  Query: {
    availableShifts: async (
      _parent: unknown,
      { input: {limit, skip, upcoming } }: {input: AvailableShiftsSearchInput},
      { users, user, organization }: Context
    ): Promise<SearchResults<Shift>> =>
      users.findOpenShifts({
        user: user!,
        organization: organization!,
        orgId: user?.member.orgId!,
        limit: limit || 10,
        skip: skip || 0,
        upcoming: !!upcoming,
      }),
    shift: async (
      _parent: unknown,
      { id }: { id: string },
      { shifts }: Context,
    ): Promise<Shift | null> => shifts.get(id),
    groupedShifts: async (
      _parent: unknown,
      { shiftId }: { shiftId: string },
      { shifts, user }: Context,
    ): Promise<Shift[] | null> => {
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
    ): Promise<SearchResults<Shift>> => users.findOpenShifts({
      user: user!,
      organization: organization!,
      orgId: user?.member.orgId!,
      limit: 100000,
      skip: 0,
      eventTypes: [EventStatus.ReadyForLottery],
    }),
    shifts: async (
      _parent: unknown,
      { input }: { input: ShiftSearchInput },
      { shifts, user }: Context
    ): Promise<SearchResults<Shift>> => {
      return shifts.dynamicSearch({
        orgId: user?.member.orgId!,
        requestingUser: user!,
        ...input,
      });
    },
    shiftUsers: async (
      _parent: unknown,
      { id, name }: { id: string, name?: string },
      { users, user }: Context
    ): Promise<UserSearchResult> => {
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
      await assignments.removeShifts(shift.assignmentId, [id], user!.id);

      // Remove any shift buffer requests
      await shiftBufferRequests.removeByShiftId(id, user!.id);
      // TODO: If there are no more shifts then I need to remove all shift lottery requests

      // Update event status or update event start/end time if needed
      await events.updateEvent({
        eventId: shift.eventId,
        removeId: id,
        removeType: EventRemoveEventType.shift,
        orgId: user?.member.orgId!,
        removeStart: shift.startTime as any,
        removeEnd: shift.endTime as any,
        modifiedById: user!.id,
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
        modifiedById: user!.id,
      });

      // Remove from shift
      await assignments.removeShifts(allShifts[0].assignmentId, allShifts.map(({ id }) => id), user!.id);

      // Remove any shift buffer requests
      await shiftBufferRequests.removeByShiftGroupId(shiftId, user!.id);
      await shiftLotteryRequests.removeByShiftGroupId(shiftId, user!.id);
      
      // Set event start/end date
      const eventId = allShifts[0].eventId;
      await events.updateEvent({
        eventId,
        removeId: shiftId,
        removeType: EventRemoveEventType.shifts,
        orgId: user?.member.orgId!,
        modifiedById: user!.id,
      });

      // TODO: Bulk remove shift notifications

      return allShifts.map(({ id }) => id);
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
    ): Promise<Shift[]> => {
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

      let highestRefNumber = await shiftsModel.highestRefNumber(shifts[0].shiftId);
      const existingShifts = await shiftsModel.search({
        shiftId: shifts[0].shiftId,
        orgId: user?.member.orgId!,
      });

      const updatedShifts = shifts.map((shift, index) => {
        const { startTime, endTime, ...rest } = shift;
        let status = rest.status;
        let createdById = rest.createdById;
        const foundShift = existingShifts.items.find(({ id }) => id === rest.id);
        if (!shift.id) {
          createdById = user?.id!;
          status = ShiftStatus.Available;
        }
        if (!rest.createdById) {
          createdById = user?.id!;
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
          status,
          availability,
          orgId: user?.member.orgId!,
          startTime: setSeconds(setMilliseconds(new Date(startTime), 0), 0).getTime(),
          endTime: setSeconds(setMilliseconds(new Date(endTime), 0), 0).getTime(),
          createdById,
          modifiedById: user?.id!,
        };
      }) as any;

      logger.info('shifts', { updatedShifts });

      const writtenShifts = await shiftsModel.bulkWrite(updatedShifts) as Shift[];

      // Add ids to assignment
      const ids = writtenShifts.map(({ id }) => id);
      await assignments.linkShifts(ids, assignment, user!.id);

      // Update any shift buffer requests
      const shiftGroupId = updatedShifts[0].shiftId;
      const startTime = updatedShifts[0].startTime;
      const endTime = updatedShifts[0].endTime;
      await shiftBufferRequests.updateByShiftGroupId(shiftGroupId, startTime, endTime, user!.id);

      // Update event start/end time
      await events.updateEvent({
        eventId,
        removeId: shifts[0].shiftId,
        removeType: EventRemoveEventType.shiftUpdate,
        orgId: user?.member.orgId!,
        modifiedById: user!.id,
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
        scheduler,
      }: Context
    ): Promise<Shift> => {
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
        adminOrOwnerOnly(shift.userId!, user);
      }

      if (userId && shift.userId && !userIsAdmin(user)) {
        throw new GraphQLError("Shift already assigned");
      }

      if (userId && userIsAdmin(user)) {
        const assignUser = await users.get(userId!);
        if (!assignUser) {
          throw new GraphQLError("User not found");
        }
        const { total } = await users.canSignUpForShift({
          user: assignUser,
          organization: organization!,
          shiftId: shift.id,
        });
        if (total === 0) {
          throw new GraphQLError("This shift has an overlapping time. Please try another assignment");
        }
      } else if (userId) {
        const assignUser = await users.get(userId!);
        if (!assignUser) {
          throw new GraphQLError("User not found");
        }
        const { total, items } = await users.findOpenShifts({
          user: assignUser,
          organization: organization!,
          orgId: user?.member.orgId!,
          limit: 1,
          skip: 0,
          shiftId: shift.id,
        });
        if (total === 0) {
          throw new GraphQLError("This shift if no longer available for this user");
        }
        if (
          !(organization?.settings?.shiftBuffer?.adminOverrideShiftBuffer && userIsAdmin(user!)) &&
          !!items?.[0]?.shiftBufferShift
        ) {
          throw new GraphQLError("This shift requires a shift buffer request");
        }
      }

      shift.userId = userId ? userId : null;
      // shift.relinquishNote = note || shift.relinquishNote;
      shift.status = userId ? ShiftStatus.Assigned : ShiftStatus.Available;

      const removingShiftUser = !userId && existingUserId;

      let updatedShift: Shift;
      let removedShift: Shift;
      if (removingShiftUser) {
        // Create removed shift
        const {id, ...createShift} = JSON.parse(JSON.stringify(shift)) as Shift;
        let status = ShiftStatus.Relinquished;
        if (existingUserId !== user!.id && userIsAdmin(user)) {
          status = ShiftStatus.Unassigned;
        }
        removedShift = await shifts.create({
          ...createShift,
          relinquishNote: note,
          status,
          modifiedById: user?.id!,
          removedAt: Date.now(),
          userId: existingUserId,
        }) as any;
        updatedShift = await shifts.update(shift, { skipMerge: true });
      } else {
        updatedShift = await shifts.update(shift, { skipMerge: true });
      }


      if (userId) {
        // Deny all open requests
        // TODO: Maybe move shift buffer request to another shift slot if one is available
        await shiftBufferRequests.denyAllOpenShiftBufferRequests({
          shiftId: shift.id,
          modifiedById: user?.id!,
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
              adminAssignedShift: user?.member.role === MemberRole.Admin,
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
            'member.tierUntil': tierUntil.getTime(),
            modifiedById: user?.id!,
          },
        });

        await scheduler.updateScheduledEvent({
          event: ScheduleEvent.USER_TIER_RETURN,
          orgId: user?.member.orgId!,
          eventTime: `at(${format(tierUntil, 'yyyy-MM-dd&&hh:mm:ss').replace('&&','T')})`,
          eventTimeZone: organization?.timezone || 'America/Los_Angeles' as any,
          customEventName: `${ScheduleEvent.USER_TIER_RETURN}-${existingUserId}`,
          eventInput: JSON.stringify({
            action: ScheduleEvent.USER_TIER_RETURN,
            orgId: user?.member.orgId!,
            userId: existingUserId,
            tier: MemberTier.Tier_1,
          }),
        });
      }

      return updatedShift!;
    }
  },
  fields: {
    Shift: {
      ...commonResolvers,
      createdBy: (shift: Shift, _, { users }: Context) => shift.createdById ? users.loader.load(shift.createdById) : null,
      org: (shift: Shift, _, { organizations }: Context) => organizations.loader.load(shift.orgId),
      event: (shift: Shift, _, { events }: Context) => events.loader.load(shift.eventId),
      assignment: (shift: Shift, _, { assignments }: Context) => assignments.loader.load(shift.assignmentId),
      startTime: (item: Shift) => new Date(item.startTime).toISOString(),
      endTime: (item: Shift) => new Date(item.endTime).toISOString(),
      user: (shift: Shift, _, { users }: Context) => shift.userId ? users.loader.load(shift.userId) : null,
      lotteryRequest: (shift: Shift, _, { shiftLotteryRequests, user, organization }: Context) =>
        shiftLotteryRequests.requestLoader.load({
          userId: user?.id!,
          orgId: organization?.id!,
          shiftGroupId: shift.shiftId,
        }),
      otherShiftSlots: (
        shift: Shift,
        _,
        { shifts }: Context
      ) => shifts.loadOtherShiftSlots.load(shift.shiftId),
    },
  },
};
