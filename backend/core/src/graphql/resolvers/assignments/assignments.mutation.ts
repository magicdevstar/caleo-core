import { GraphQLError } from "graphql";
import { Context } from "../../../utils/createContext";
import { adminOnly } from "../../../utils/access";
import { ObjectId } from "mongodb";
import { IAssignment } from "../../../models/assignment";
import { EventRemoveEventType } from "../../../models/event";
import { IShift } from "../../../models/shift";
import { AssignmentAttachmentUpload, EventUserActionLogAction, EventUserActionLogSource, EventUserActionType } from "../../../__generated__/resolvers-types";
import { IEventNotification } from "../../../models/eventNotifications/eventNotifications.entity";
import { DEMOBILIZE } from "../../../models/eventNotifications/eventNotifications.const";

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
  demobilized: async (
    _parent: unknown,
    { assignmentId }: { assignmentId: ObjectId },
    { shifts, eventUserActions, notificationService, eventNotifications, user, organization }: Context,
  ): Promise<boolean> => {
    adminOnly(user);

    const shiftFilter: any = {
      assignmentId,
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
    const assignmentShifts = await shifts.collection.find<IShift>(shiftFilter).toArray();
    const bulkEdits = assignmentShifts.map(shift => ({
      userId: shift.userId,
      eventId: shift.eventId,
      shiftGroupId: shift.shiftId,
      actionType: EventUserActionType.Shift,
      source: EventUserActionLogSource.Shift,
      modifiedById: user._id!,
      timestamp: new Date(),
      action: EventUserActionLogAction.Demobilized,
    }));

    if (bulkEdits.length > 0) {
      await eventUserActions.bulk(bulkEdits);
    }

    await eventNotifications.create<IEventNotification>({
      title: DEMOBILIZE.title,
      description: DEMOBILIZE.description,
      assignmentId: assignmentId,
      orgId: user!.member.orgId,
      modifiedById: user!._id!,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await notificationService.demobilizeNotification({
      organization,
      assignmentId: assignmentId,
    });

    return true;
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
