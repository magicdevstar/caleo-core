import { ScheduleEvent } from "../models/scheduler";

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

export interface ShiftUpsertNotification extends BaseNotificationEvent {
  id: string;
};
export interface ShiftRemoveNotification extends ShiftUpsertNotification {};

export interface ShiftUpsertAllNotifications extends BaseNotificationEvent {
  shiftId: string;
};
export interface ShiftRemoveAllNotifications extends ShiftUpsertAllNotifications {};
