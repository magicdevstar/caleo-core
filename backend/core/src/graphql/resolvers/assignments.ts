import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import { AssignmentSearchInput } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { EventRemoveEventType } from "../../models/event";
import { ObjectId } from "mongodb";
import { IAssignment } from "../../models/assignment";

export const assignments = {
  Query: {
    assignment: async (
      _parent: unknown,
      { id }: { id: string },
      { assignments }: Context,
    ): Promise<IAssignment | null> => assignments.get(id, { removed: true }),
    assignments: async (
      _parent: unknown,
      { input: {limit, skip, ...input} }: {input: AssignmentSearchInput},
      { assignments, user }: Context
    ): Promise<SearchResults<IAssignment>> => assignments.search({
      limit,
      skip,
      ...input,
      ...(input.eventId && { eventId: new ObjectId(input.eventId) }),
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
      await shiftBufferRequests.removeByAssignmentId(id, user!._id!);
      await shiftLotteryRequests.removeByAssignmentId(id, user!._id!);

      // Remove assignmentId from event and update status if needed
      await events.updateEvent({
        eventId: assignment.eventId,
        removeId: id,
        removeType: EventRemoveEventType.assignment,
        orgId: user?.member.orgId!,
        modifiedById: user!._id!,
      });

      return id;
    },
    assignment: async (
      _parent: unknown,
      { assignment }: { assignment: IAssignment },
      { assignments, events, user }: Context
    ): Promise<IAssignment> => {
      adminOnly(user);

      const event = await events.get(assignment.eventId.toString());
      if (!event) {
        throw new GraphQLError("Event not found");
      }

      let updatedAssignment: IAssignment;
      if (assignment.id) {
        const currentAssignment = await assignments.get(assignment.id);
        if (!currentAssignment) {
          throw new GraphQLError("Assignment not found");
        }
      } 

      updatedAssignment = await assignments.upsert({
        ...assignment,
        ...(assignment.eventId && { eventId: new ObjectId(assignment.eventId) }),
        ...(assignment.requiredSkillIds && { requiredSkillIds: assignment.requiredSkillIds.map((id) => new ObjectId(id)) }),
        ...(assignment.rankIds && { rankIds: assignment.rankIds.map((id) => new ObjectId(id)) }),
        orgId: new ObjectId(user?.member.orgId!),
        modifiedById: new ObjectId(user!.id),
      });

      if (!assignment.id) {
        await events.addAssignmentId(
          event._id!,
          updatedAssignment._id!,
          new ObjectId(user!.id)
        );
      }

      return updatedAssignment;
    },
  },
  fields: {
    Assignment: {
      ...commonResolvers,
      org: (assignment: IAssignment, _, { organizations }: Context) => organizations.loader.load(assignment.orgId.toString()),
      event: (assignment: IAssignment, _, { events }: Context) => events.loader.load(assignment.eventId.toString()),
      requiredSkills: (assignment: IAssignment, _, { skills }: Context) => skills.loader.loadMany((assignment.requiredSkillIds || []).map((id) => id.toString())),
      ranks: (assignment: IAssignment, _, { ranks }: Context) => ranks.loader.loadMany((assignment.rankIds || []).map((id) => id.toString())),
      shifts: (assignment: IAssignment, _, { shifts }: Context) => shifts.loader.loadMany((assignment.shiftIds || []).map((id) => id.toString())),
      availableShifts: async (item: IAssignment, _arg: unknown, { shifts }: Context) => shifts.assignmentShiftCount.load(item.id?.toString()!),
    },
  },
};
