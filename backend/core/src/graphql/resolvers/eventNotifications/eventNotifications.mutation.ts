import { IEventNotification } from "../../../models/eventNotifications/eventNotifications.entity";
import { adminOnly } from "../../../utils/access";
import { Context } from "../../../utils/createContext";

export const Mutation = {
  eventNotification: async (
    _parent: unknown,
    { input }: { input: IEventNotification },
    { eventNotifications, notificationService, user, organization }: Context,
  ) => {
    adminOnly(user);
    const doc = await eventNotifications.create({
      ...input,
      orgId: user.member.orgId,
      modifiedById: user._id!,
    });

    if (input.assignmentId) {
      await notificationService.directEventNotification({
        id: doc._id!,
        title: input.title,
        description: input.description,
        organization,
        assignmentId: input.assignmentId,
        dispatchedById: user._id!,
      });
    }

    return doc;
  },
  eventNotificationAttachmentUploadUrl: async (
    _parent: unknown,
    _args: unknown,
    { eventNotifications, user }: Context,
  ) => {
    adminOnly(user);
    return eventNotifications.getUploadUrl({
      orgId: user.member.orgId,
    });
  },
};
