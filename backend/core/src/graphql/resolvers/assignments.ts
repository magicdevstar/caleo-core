import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import { SearchInput, Assignment, UpsertAssignment } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { EventRemoveEventType } from "../../models/event";

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
      {
        assignments,
        events,
        shiftBufferRequests,
        shiftLotteryRequests,
        organization,
        user,
      }: Context
    ): Promise<string> => {
      adminOnly(user);

      const assignment = await assignments.get(id);
      if (!assignment) {
        throw new GraphQLError("Assignment not found");
      }

      await assignments.removeAssignment({
        assignment,
        organization: organization!,
        user: user!,
      });

      // Remove all shifts for this assignment
      // (This will happen after we send the notification event)
      // await shifts.removeAllByAssignmentId(user?.member.orgId!, id);

      // Remove shift buffer requests
      await shiftBufferRequests.removeByAssignmentId(id, user!.id);
      await shiftLotteryRequests.removeByAssignmentId(id, user!.id);

      // Remove assignmentId from event and update status if needed
      await events.updateEvent({
        eventId: assignment.eventId,
        removeId: id,
        removeType: EventRemoveEventType.assignment,
        orgId: user?.member.orgId!,
        modifiedById: user!.id,
      });

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
          modifiedById: user!.id,
        } as any, { skipMerge: true });
      } else {
        updatedAssignment = await assignments.upsert({
          ...assignment,
          orgId: user?.member.orgId!,
          modifiedById: user!.id,
        } as any);
      }


      if (!assignment.id) {
        await events.update({
          ...event,
          assignmentIds: [...(event.assignmentIds || []), updatedAssignment.id],
          modifiedById: user!.id,
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
