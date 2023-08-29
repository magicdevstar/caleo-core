import { GraphQLError } from "graphql";
import { Context } from "../..";
import { SearchInput, Assignment, UpsertAssignment, DocType, EventStatus } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import logger from "../../utils/logger";
import { isAfter, isBefore } from "date-fns";

export const assignments = {
  Query: {
    assignment: async (
      _parent: unknown,
      { id }: { id: string },
      { assignments }: Context,
    ): Promise<Assignment | null> => assignments.get(id),
    assignments: async (
      _parent: unknown,
      { limit, skip }: SearchInput,
      { assignments, user }: Context
    ): Promise<SearchResults<Assignment>> => assignments.search({
      limit,
      skip,
      orgId: user?.member.orgId!,
    })
  },
  Mutation: {
    removeAssignment: async (
      _parent: unknown,
      { id }: { id: string },
      { assignments, events, shifts, user }: Context
    ): Promise<string> => {
      adminOnly(user);

      const assignment = await assignments.get(id);
      if (!assignment) {
        throw new GraphQLError("Assignment not found");
      }

      await assignments.remove(id);

      // Remove all shifts for this assignment
      const shiftRes = await shifts.collection.deleteMany({
        orgId: user?.member.orgId!,
        docType: DocType.Shift,
        assignmentId: id,
      });
      if (shiftRes.deletedCount === 0) {
        logger.warn('No shifts removed', {
          orgId: user?.member.orgId!,
          docType: DocType.Shift,
          assignmentId: id,
          eventId: assignment.eventId,
        });
      }

      // Remove assignmentId from event and update status if needed
      const event = await events.get(assignment.eventId);
      if (event) {
        const shiftCount = await shifts.collection.countDocuments({
          docType: DocType.Shift,
          orgId: user?.member.orgId!,
          assignmentId: {$ne: id},
        });
        const {items: filteredShifts} = await shifts.search({
          docType: DocType.Shift,
          orgId: user?.member.orgId!,
          assignmentId: {$ne: id},
        });
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
          status: shiftCount === 0 ? EventStatus.Draft : event.status,
          assignmentIds: (event.assignmentIds || []).filter((aid) => aid !== id),
          startTime: startTime ? startTime.getTime() : null,
          endTime: endTime ? endTime.getTime() : null,
        } as any, { skipMerge: true });
      }

      return id;
    },
    assignment: async (
      _parent: unknown,
      { assignment }: { assignment: UpsertAssignment },
      { assignments, events, user }: Context
    ): Promise<Assignment> => {
      adminOnly(user);

      const event = await events.get(assignment.eventId);
      if (!event) {
        throw new GraphQLError("Event not found");
      }

      let updatedAssignment: Assignment;
      if (assignment.id) {
        const currentAssignment = await assignments.get(assignment.id);
        if (!currentAssignment) {
          throw new GraphQLError("Assignment not found");
        }
        updatedAssignment = await assignments.update({
          ...currentAssignment,
          ...assignment,
        } as any, { skipMerge: true });
      } else {
        updatedAssignment = await assignments.upsert({
          ...assignment,
          orgId: user?.member.orgId!,
        } as any);
      }


      if (!assignment.id) {
        await events.update({
          ...event,
          assignmentIds: [...(event.assignmentIds || []), updatedAssignment.id],
        } as any, { skipMerge: true });
      }

      return updatedAssignment;
    },
  },
  fields: {
    Assignment: {
      ...commonResolvers,
      org: (assignment: Assignment, _, { organizations }: Context) => organizations.loader.load(assignment.orgId),
      event: (assignment: Assignment, _, { events }: Context) => events.loader.load(assignment.eventId),
      requiredSkills: (assignment: Assignment, _, { skills }: Context) => skills.loader.loadMany((assignment.requiredSkillIds || []) as any),
      ranks: (assignment: Assignment, _, { ranks }: Context) => ranks.loader.loadMany((assignment.rankIds || []) as any),
      shifts: (assignment: Assignment, _, { shifts }: Context) => shifts.loader.loadMany((assignment.shiftIds || []) as any),
    },
  },
};
