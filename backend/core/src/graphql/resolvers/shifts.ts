import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import {
  DocType,
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
import { ObjectId } from "mongodb";
import { addDays, format } from "date-fns";
import { ScheduleEvent } from "../../models/scheduler";
import { utcToZonedTime } from "date-fns-tz";
import logger from "../../utils/logger";

export const shift = {
  Query: {
    availableShifts: async (
      _parent: unknown,
      { input: {limit, skip} }: { input: { limit: number; skip: number; } },
      { users, user, organization }: Context
    ): Promise<SearchResults<Shift>> =>
      users.findOpenShifts({
        user: user!,
        organization: organization!,
        orgId: user?.member.orgId!,
        limit,
        skip,
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
      });
      return items;
    },
    lotteryShifts: async (
      _parent: unknown,
      _: unknown,
      { shifts, user }: Context
    ): Promise<SearchResults<Shift>> => shifts.findOpenLotteryShifts({
      orgId: user?.member?.orgId!,
    }),
    shifts: async (
      _parent: unknown,
      { input }: { input: ShiftSearchInput },
      { shifts, user }: Context
    ): Promise<SearchResults<Shift>> => {
      const { startTime, endTime, userId, ...searchInput } = input;

      if (userId !== user?.id && !userIsAdmin(user)) {
        (searchInput as any).userId = user?.id;
      } else {
        (searchInput as any).userId = userId;
      }

      if (startTime) {
        (searchInput as any).endTime = {
          $gte: new Date(startTime).getTime(),
        };
      } else if (endTime) {
        (searchInput as any).endTime = {
          $lte: new Date(endTime).getTime(),
        };
      }

      return shifts.search({
        orgId: user?.member.orgId!,
        ...searchInput,
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
      
      await shifts.remove(id);
      
      // Remove shift from assignment
      await assignments.removeShifts(shift.assignmentId, [id]);

      // Remove any shift buffer requests
      await shiftBufferRequests.removeByShiftId(id);
      // TODO: If there are no more shifts then I need to remove all shift lottery requests

      // Update event status or update event start/end time if needed
      await events.updateEvent({
        eventId: shift.eventId,
        removeId: id,
        removeType: EventRemoveEventType.shift,
        orgId: user?.member.orgId!,
        removeStart: shift.startTime as any,
        removeEnd: shift.endTime as any,
      });

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

      await shifts.collection.deleteMany({
        shiftId,
        docType: DocType.Shift,
        orgId: user?.member.orgId!,
      });

      // Remove from shift
      await assignments.removeShifts(allShifts[0].assignmentId, allShifts.map(({ id }) => id));

      // Remove any shift buffer requests
      await shiftBufferRequests.removeByShiftGroupId(shiftId);
      await shiftLotteryRequests.removeByShiftGroupId(shiftId);
      
      // Set event start/end date
      const eventId = allShifts[0].eventId;
      await events.updateEvent({
        eventId,
        removeId: shiftId,
        removeType: EventRemoveEventType.shifts,
        orgId: user?.member.orgId!,
      });

      return allShifts.map(({ id }) => id);
    },
    shifts: async (
      _parent: unknown,
      { shifts }: { shifts: UpsertShift[] },
      { organizations, assignments, events, shiftBufferRequests, shifts: shiftsModel, user }: Context
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

      const updatedShifts = shifts.map((shift) => {
        const { startTime, endTime, ...rest } = shift;
        let status = rest.status;
        if (!shift.id) {
          status = ShiftStatus.Available;  
        }
        return {
          ...rest,
          status,
          availability,
          orgId: user?.member.orgId!,
          startTime: new Date(startTime).getTime(),
          endTime: new Date(endTime).getTime(),
        };
      }) as any;

      const writtenShifts = await shiftsModel.bulkWrite(updatedShifts) as Shift[];

      // Add ids to assignment
      const ids = writtenShifts.map(({ id }) => id);
      await assignments.linkShifts(ids, assignment);

      // Update any shift buffer requests
      const shiftGroupId = updatedShifts[0].shiftId;
      const startTime = updatedShifts[0].startTime;
      const endTime = updatedShifts[0].endTime;
      await shiftBufferRequests.updateByShiftGroupId(shiftGroupId, startTime, endTime);

      // Update event start/end time
      await events.updateEvent({
        eventId,
        removeId: shifts[0].shiftId,
        removeType: EventRemoveEventType.shiftUpdate,
        orgId: user?.member.orgId!,
      });

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

      if (shift.userId && !userIsAdmin(user)) {
        throw new GraphQLError("Shift already assigned");
      }

      if (userId && userIsAdmin(user)) {
        const user = await users.get(userId!);
        const { total } = await users.canSignUpForShift({
          user: user!,
          organization: organization!,
          shiftId: shift.id,
        });
        if (total === 0) {
          throw new GraphQLError("This shift has an overlapping time. Please try another assignment");
        }
      } else if (userId) {
        const user = await users.get(userId!);
        const { total, items } = await users.findOpenShifts({
          user: user!,
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
      shift.relinquishNote = note || shift.relinquishNote;
      shift.status = userId ? ShiftStatus.Assigned : ShiftStatus.Available;

      const updatedShift = await shifts.update(shift, { skipMerge: true });

      if (userId) {
        // Deny all open requests
        // TODO: Move shift buffer request to another shift slot if one is available
        await shiftBufferRequests.denyAllOpenShiftBufferRequests({
          shiftId: shift.id
        });
      }
      if (!userId && existingUserId && organization?.settings?.userRelinquishShift.enabled && !userIsAdmin(user)) {
        const tier = organization?.settings?.userRelinquishShift?.afterShiftRemove?.tier;
        const days = organization?.settings?.userRelinquishShift?.afterShiftRemove?.days;
        const zonedDate = utcToZonedTime(new Date(), organization?.timezone || 'America/Los_Angeles' as any);
        const tierUntil =  addDays(zonedDate, days);
        const updateRes = await users.collection.updateOne({
          _id: new ObjectId(existingUserId),
        }, {
          $set: {
            'member.tier': tier,
            'member.tierUntil': tierUntil.getTime(),
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

      return updatedShift;
    }
  },
  fields: {
    Shift: {
      ...commonResolvers,
      org: (shift: Shift, _, { organizations }: Context) => organizations.loader.load(shift.orgId),
      event: (shift: Shift, _, { events }: Context) => events.loader.load(shift.eventId),
      assignment: (shift: Shift, _, { assignments }: Context) => assignments.loader.load(shift.assignmentId),
      startTime: (item: Shift) => new Date(item.startTime).toISOString(),
      endTime: (item: Shift) => new Date(item.endTime).toISOString(),
      user: (shift: Shift, _, { users }: Context) => shift.userId ? users.loader.load(shift.userId) : null,
    },
  },
};
