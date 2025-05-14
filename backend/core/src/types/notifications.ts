import { ScheduleEvent } from "../models/scheduler";
import { IChangeData } from "./change.streams";

export enum NotificationType {
  Shift = ScheduleEvent.SHIFT_REMINDER,
}

export enum ShiftNotificationAction {
  UpsertNotification = 'upsert_notification',
  RemoveNotification = 'remove_notification',
  UpsertAllNotifications = 'upsert_all_notifications',
  RemoveAllNotifications = 'remove_all_notifications'
};

export interface BaseNotificationEvent {
  type: NotificationType;
  action: ShiftNotificationAction;
}

export interface IEventUpdates {
  name?: IChangeData;
  venueId?: IChangeData;
  startTime?: IChangeData;
  endTime?: IChangeData;
  notes?: IChangeData;
};

export interface IAssignmentUpdates {
  name?: IChangeData;
  notes?: IChangeData;
  bwNeeded?: IChangeData;
  requiredSkillIds?: IChangeData;
  requiredEquipmentIds?: IChangeData;
  shiftIds?: IChangeData;
};

export interface IShiftUpdates {
  startTime?: IChangeData;
  endTime?: IChangeData;
}

export interface ShiftUpsertNotification extends BaseNotificationEvent {
  id: string;
};
export interface ShiftRemoveNotification extends ShiftUpsertNotification {};

export interface ShiftUpsertAllNotifications extends BaseNotificationEvent {
  shiftId: string;
};
export interface ShiftRemoveAllNotifications extends ShiftUpsertAllNotifications {};
