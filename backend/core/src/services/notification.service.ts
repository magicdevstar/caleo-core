import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { IShift, ShiftModel } from "../models/shift";
import { IEventUpdates, NotificationType, ShiftNotificationAction } from "../types/notifications";
import { IOrganization } from "../models/organizations/organization.entity";
import { Action, MailerEvent, MailerEvents } from "../types/mailer";
import { IUser } from "../types/common";
import { ObjectId } from "mongodb";

const lambda = new LambdaClient({
  maxAttempts: 3,
});

export enum ShiftNotificationType {
  // When the assigned user removes themselves from the shift
  SHIFT_USER_REMOVED = "SHIFT_USER_REMOVED",
  // When the assigned user is removed from the shift by an admin or system
  SHIFT_ADMIN_REMOVED = "SHIFT_ADMIN_REMOVED",
  // When the assigned user is added to the shift by themselves
  SHIFT_USER_ASSIGNED = "SHIFT_USER_ASSIGNED",
  // When the assigned user is added to the shift by an admin or system
  SHIFT_ADMIN_ASSIGNED = "SHIFT_ADMIN_ASSIGNED",
  // When the shift time is changed
  SHIFT_TIME_CHANGED = "SHIFT_TIME_CHANGED",
}

export class NotificationService {
  constructor(
    private shifts: ShiftModel,
  ) {}

  async setOrRemoveShiftReminder({
    shiftId,
    type,
  }: {
    shiftId: string;
    type: ShiftNotificationType;
  }) {
    const action = [
      ShiftNotificationType.SHIFT_ADMIN_REMOVED,
      ShiftNotificationType.SHIFT_USER_REMOVED,
    ].includes(type) ?
      ShiftNotificationAction.RemoveAllNotifications :
      ShiftNotificationAction.UpsertAllNotifications;

    // Scheduler reminder notification
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.SHIFT_NOTIFICATION_SCHEDULER,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        type: NotificationType.Shift,
        action,
        shiftId,
      }),
    }));
  }

  async shiftAssignmentNotifications({
    organization,
    user,
    existingUserId,
    shift,
    type,
  }: {
    organization: IOrganization;
    shift: IShift;
    existingUserId?: string | null;
    user: IUser;
    type: ShiftNotificationType | null;
  }) {
    if (type === null) {
      return;
    }

    let template = MailerEvents.OfficerAdminAssignedShift;
    let data: any = {
      adminAssignedShift: false,
      shift,
      organization,
    };

    switch (type) {
      case ShiftNotificationType.SHIFT_USER_ASSIGNED:
        data.adminAssignedShift = false;
        break;
      case ShiftNotificationType.SHIFT_ADMIN_ASSIGNED:
        data.adminAssignedShift = true;
        break;
      case ShiftNotificationType.SHIFT_ADMIN_REMOVED:
        data = {
          shift,
          existingUserId,
          removeUser: user,
          organization,
        };
        template = MailerEvents.OfficerRemovedFromShift;
        break;
      case ShiftNotificationType.SHIFT_USER_REMOVED:
        data = {
          shift,
          existingUserId,
          removeUser: user,
          organization,
        };
        template = MailerEvents.AdminShiftRelinquished;
        break;
      default:
        template = MailerEvents.OfficerAdminAssignedShift;
        break;
    }

    // Send notification to user
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA!,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template,
        data,
      } as MailerEvent),
    }));

    // Modify shift notifications for the user
    await this.setOrRemoveShiftReminder({
      shiftId: shift.shiftId,
      type,
    });
  }

  async notifyUsersOfShiftAvailability({
    shiftId,
    organization,
  }: {
    organization: IOrganization;
    shiftId: string;
  }) {
    const emptyShifts = await this.shifts.collection.find({
      shiftId,
      removedAt: { $exists: false },
      $or: [
        { userId: null },
        { userId: { $exists: false } },
      ],
    }, {
      projection: {
        _id: 1,
      }
    }).toArray();

    // No empty shifts found
    if (emptyShifts.length === 0) {
      return;
    }

    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA!,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template: MailerEvents.OfficerFcfsShiftAvailable,
        data: {
          shiftId,
          organization,
        },
      } as MailerEvent),
    }));
  }

  async shiftCheckInOutNotification({
    template,
    organization,
    shift,
    originalShift,
  }: {
    template: MailerEvents.OfficerShiftCheckInOutEdited | MailerEvents.OfficerShiftAutoCheckout;
    shift: IShift;
    originalShift: IShift;
    organization: IOrganization;
  }) {
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA!,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template,
        data: {
          originalShift,
          shift: shift,
          organization,
        }
      } as MailerEvent),
    }));
  }

  async eventChange({
    eventId,
    orgId,
    updates,
  }: {
    eventId: ObjectId;
    orgId: ObjectId;
    updates: IEventUpdates;
  }) {
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA!,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template: MailerEvents.OfficerEventEdited,
        data: {
          eventId,
          orgId,
          updates,
        }
      } as MailerEvent),
    }));
  }

  async assignmentChange({
    assignmentId,
    orgId,
    updates,
  }: {
    assignmentId: ObjectId;
    orgId: ObjectId;
    updates: IEventUpdates;
  }) {
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA!,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template: MailerEvents.OfficerAssignmentEdited,
        data: {
          assignmentId,
          orgId,
          updates,
        }
      } as MailerEvent),
    }));
  }

  async shiftChange({
    shiftId,
    orgId,
    updates,
  }: {
    shiftId: string;
    orgId: ObjectId;
    updates: IEventUpdates;
  }) {
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA!,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template: MailerEvents.OfficerShiftEdited,
        data: {
          shiftId,
          orgId,
          updates,
        }
      } as MailerEvent),
    }));
  }
}
