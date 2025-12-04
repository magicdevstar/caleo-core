import { GraphQLError } from "graphql";
import { Context } from "../../../utils/createContext";
import { adminOnly } from "../../../utils/access";
import { ObjectId } from "mongodb";
import { IAssignment } from "../../../models/assignment";
import { EventRemoveEventType } from "../../../models/event";
import { AssignmentAttachmentUpload } from "../../../__generated__/resolvers-types";

export const Mutation = {
  assignmentAttachmentUploadUrl: async (
    _parent: unknown,
    _args: unknown,
    { assignments, user }: Context
  ): Promise<AssignmentAttachmentUpload> => {
    adminOnly(user);
    return assignments.getUploadUrl({
      orgId: user.member.orgId!,
    });
  },
  demobilized: async () => {
    throw new GraphQLError("Demobilization is currently disabled");
  },
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

    const assignment = await assignments.get(id, { removed: true });
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
      orgId: user.member.orgId,
      modifiedById: user._id!,
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

    if (assignment.id) {
      const currentAssignment = await assignments.get(assignment.id);
      if (!currentAssignment) {
        throw new GraphQLError("Assignment not found");
      }
    } 

    const updatedAssignment = await assignments.upsert({
      ...assignment,
      ...(assignment.eventId && { eventId: new ObjectId(assignment.eventId) }),
      ...(assignment.requiredSkillIds && { requiredSkillIds: assignment.requiredSkillIds.map((id) => new ObjectId(id)) }),
      ...(assignment.rankIds && { rankIds: assignment.rankIds.map((id) => new ObjectId(id)) }),
      ...(assignment.requiredEquipmentIds && { requiredEquipmentIds: assignment.requiredEquipmentIds.map((id) => new ObjectId(id)) }),
      ...(assignment.shiftSlots ? {
        shiftSlots: assignment.shiftSlots.map((shiftSlot) => ({
          ...shiftSlot,
          id: !shiftSlot?.id ? new ObjectId() : shiftSlot.id,
        })),
      } : {}),
      orgId: new ObjectId(user.member.orgId),
      modifiedById: new ObjectId(user.id),
    });

    if (!assignment.id) {
      await events.updateEventPostAssignmentCreate(
        event._id!,
        [updatedAssignment._id!],
        new ObjectId(user!.id),
        {}
      );
    }

    return updatedAssignment;
  },
};
