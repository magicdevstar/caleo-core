import { GraphQLError } from "graphql";
import uniq from 'lodash.uniq';
import { Context } from "../..";
import { SearchInput, Shift, ShiftStatus, UpsertShift } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { isAfter, isBefore } from "date-fns";
import logger from "../../utils/logger";

export const shift = {
  Query: {
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
        limit: 1000,
        shiftId,
        orgId: user?.member.orgId!,
      });
      return items;
    },
    shifts: async (
      _parent: unknown,
      { limit, skip }: SearchInput,
      { shifts, user }: Context
    ): Promise<SearchResults<Shift>> => shifts.search({
      limit,
      skip,
      orgId: user?.member.orgId!,
    })
  },
  Mutation: {
    removeShift: async (
      _parent: unknown,
      { id }: { id: string },
      { assignments, events, shifts, user }: Context
    ): Promise<string> => {
      adminOnly(user);

      const shift = await shifts.get(id);
      if (!shift) {
        throw new GraphQLError("Shift not found");
      }
      
      await shifts.remove(id);
      
      const assignment = await assignments.get(shift.assignmentId);
      if (assignment) {
        await assignments.update({
          ...assignment,
          shiftIds: (assignment.shiftIds || []).filter((sid) => sid !== id),
        } as any, { skipMerge: true });
      }

      const event = await events.get(shift.eventId);
      const sameStart = event?.startTime === shift.startTime;
      const sameEnd = event?.endTime === shift.endTime;
      if (event && sameStart || sameEnd) {
        const {items: allShifts} = await shifts.search({
          limit: 1000,
          eventId: event.id,
        });
        // Just incase the delete has not propagated to all read servers 
        const filteredShifts = allShifts.filter(({ id: sId }) => sId !== id);
        const startTime = filteredShifts.reduce((curr: Date | null, shift) => {
          const start = new Date(shift.startTime);
          if (!curr || isBefore(start, curr)) {
            return start;
          }
          return curr;
        }, null);
        const endTime = filteredShifts.reduce((curr: Date | null, shift) => {
          const end = new Date(shift.endTime);
          if (!curr || isAfter(end, curr)) {
            return end;
          }
          return curr;
        }, null);

        await events.update({
          ...event,
          startTime: startTime ? startTime.getTime() : null,
          endTime: endTime ? endTime.getTime() : null,
        }, {
          skipMerge: true,
        });
      }

      return id;
    },
    shifts: async (
      _parent: unknown,
      { shifts }: { shifts: UpsertShift[] },
      { assignments, events, shifts: shiftsModel, user }: Context
    ): Promise<Shift[]> => {
      adminOnly(user);

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
          orgId: user?.member.orgId!,
          startTime: new Date(startTime).getTime(),
          endTime: new Date(endTime).getTime(),
        };
      }) as any;

      const writtenShifts = await shiftsModel.bulkWrite(updatedShifts) as Shift[];

      // Add ids to event
      const ids = writtenShifts.map(({ id }) => id);
      const currentShiftIds = assignment.shiftIds || [];
      const newIds = ids.filter((id) => !currentShiftIds.includes(id));
      if (newIds.length > 0) {
        const shiftIds = uniq([...currentShiftIds, ...newIds]);
        await assignments.update({
          ...assignment,
          shiftIds,
        }, { skipMerge: true });
      }

      // Update event start/end time
      const earliestStart = writtenShifts.reduce((curr, shift) => {
        const start = new Date(shift.startTime);
        if (curr === null || isBefore(start, curr)) {
          return start;
        }
        return curr;
      }, event.startTime ? new Date(event.startTime) : null) as Date;

      const latestEnd = writtenShifts.reduce((curr, shift) => {
        const end = new Date(shift.endTime);
        if (curr === null || isAfter(end, curr)) {
          return end;
        }
        return curr;
      }, event.endTime ? new Date(event.endTime) : null) as Date;

      logger.info('Times', {
        latestEnd,
        earliestStart,
        event,
      });

      if (!event.startTime || !event.endTime || isBefore(earliestStart, new Date(event.startTime)) || isAfter(latestEnd, new Date(event.endTime))) {
        const startTime = !event.startTime || isBefore(earliestStart, new Date(event.startTime!)) ? earliestStart.getTime() : new Date(event.startTime!).getTime();
        const endTime = !event.endTime || isAfter(latestEnd, new Date(event.endTime!)) ? latestEnd.getTime() : new Date(event.endTime!).getTime();
        await events.update({
          ...event,
          startTime,
          endTime,
        });
      }

      return writtenShifts;
    },
  },
  fields: {
    Shift: {
      ...commonResolvers,
      org: (shift: Shift, _, { organizations }: Context) => organizations.loader.load(shift.orgId),
      event: (shift: Shift, _, { events }: Context) => events.loader.load(shift.eventId),
      assignment: (shift: Shift, _, { assignments }: Context) => assignments.loader.load(shift.assignmentId),
      startTime: (item: Shift) => new Date(item.startTime).toISOString(),
      endTime: (item: Shift) => new Date(item.endTime).toISOString(),
    },
  },
};
