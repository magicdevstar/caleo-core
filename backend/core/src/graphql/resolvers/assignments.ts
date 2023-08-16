import { GraphQLError } from "graphql";
import { Context } from "../..";
import { SearchInput, Assignment, UpsertAssignment } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";

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

      const event = await events.get(assignment.eventId);

      await assignments.remove(id);

      if (event) {
        await events.update({
          ...event,
          assignmentIds: (event.assignmentIds || []).filter((aid) => aid !== id),
        } as any, { skipMerge: true });
      }

      // Remove all shifts for this assignment
      await Promise.allSettled((assignment.shiftIds || []).map((id: any) => shifts.remove(id)));

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

      const updatedAssignment = await assignments.upsert({
        ...assignment,
        orgId: user?.member.orgId!,
      } as any);

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
