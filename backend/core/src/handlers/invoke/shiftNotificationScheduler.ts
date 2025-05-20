
import { randomUUID as uuid } from 'crypto';
import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';

import logger from '../../utils/logger';
import { createContext, IServiceContext } from '../../utils/createContext';
import {
  BaseNotificationEvent,
  NotificationType,
  ShiftNotificationAction,
  ShiftRemoveAllNotifications,
  ShiftRemoveNotification,
  ShiftUpsertAllNotifications,
  ShiftUpsertNotification
} from '../../types/notifications';
import { ScheduleEvent, SchedulerModel } from '../../models/scheduler';
import { ObjectId } from 'mongodb';
import { toZonedTime } from 'date-fns-tz';
import { format, subHours, subDays, isAfter } from 'date-fns';
import { ShiftReminderUnit } from '../../__generated__/resolvers-types';

interface IShiftNotificationScheduler {
  action: NotificationType;
  eventId: string;
  shift: {
    id: string;
    userId: string;
  };
};

const upsertShiftReminder = async ({
  scheduler,
  orgId,
  startTime,
  time,
  unit = ShiftReminderUnit.Hour,
  customEventName,
  payload,
  tz,
  event
}: {
  event: ScheduleEvent;
  customEventName: string;
  payload: IShiftNotificationScheduler;
  scheduler: SchedulerModel
  startTime: Date;
  orgId: string;
  time: number;
  unit: ShiftReminderUnit;
  tz: string;
}) => {
  const startDate = new Date(startTime);
  let modifiedDate = subHours(startDate, time);
  if (unit === ShiftReminderUnit.Day) {
    modifiedDate = subDays(startDate, time);
  }
  const zonedDate = toZonedTime(modifiedDate, tz);

  const now = toZonedTime(new Date(), tz);
  if (isAfter(now, zonedDate)) {
    logger.info('Skipping reminder', { startTime, now, zonedDate });
    return;
  }

  await scheduler.updateScheduledEvent({
    event,
    orgId: new ObjectId(orgId),
    eventTime: `at(${format(zonedDate, 'yyyy-MM-dd&&HH:mm:ss').replace('&&','T')})`,
    eventTimeZone: tz as any,
    customEventName,
    eventInput: payload,
  });

  return;
};

const upsertNotification = async ({
  context: { scheduler, shifts, organizations },
  id,
} : {
  context: IServiceContext;
  id: string;
}) => {
  const shift = await shifts.get(id);
  if (!shift || !shift.userId) {
    return;
  }
  const organization = await organizations.get(shift.orgId);
  const eventId = shift.notificationId || uuid();
  const tz = organization?.timezone || 'America/Los_Angeles';
  const payload: IShiftNotificationScheduler = {
    action: NotificationType.Shift,
    eventId,
    shift: {
      id,
      userId: shift.userId.toString(),
    },
  };

  // Primary reminder
  const reminderHours = organization?.settings?.shiftReminder.time || 24;
  const reminderUnit = organization?.settings?.shiftReminder.unit || ShiftReminderUnit.Hour;
  await upsertShiftReminder({
    event: ScheduleEvent.SHIFT_REMINDER,
    payload,
    scheduler,
    orgId: shift.orgId.toString(),
    startTime: shift.startTime,
    time: reminderHours,
    unit: reminderUnit,
    customEventName: eventId,
    tz,
  });

  // Secondary reminder
  if (organization?.settings?.secondaryShiftReminder?.enabled) {
    const secondaryReminderHours = organization?.settings?.secondaryShiftReminder.time || 7;
    const secondaryReminderUnit = organization?.settings?.secondaryShiftReminder.unit || ShiftReminderUnit.Day;
    await upsertShiftReminder({
      event: ScheduleEvent.SHIFT_REMINDER_2,
      payload,
      scheduler,
      orgId: shift.orgId.toString(),
      startTime: shift.startTime,
      time: secondaryReminderHours,
      unit: secondaryReminderUnit,
      customEventName: `${ScheduleEvent.SHIFT_REMINDER_2}_${shift.id}`,
      tz,
    });
  }

  await shifts.collection.updateOne({ _id: new ObjectId(id) }, {
    $set: {
      notificationId: eventId,
    }
  });
};

const removeNotification = async ({
  context: { scheduler, shifts },
  id,
}: {
  context: IServiceContext;
  id: string;
}) => {
  const shift = await shifts.get(id);
  if (!shift || !shift.notificationId) {
    return;
  }
  await scheduler.removeSchedule({
    customEventName: shift.notificationId,
    ignoreError: true,
  });
  
  await scheduler.removeSchedule({
    customEventName: `${ScheduleEvent.SHIFT_REMINDER_2}_${shift.id}`,
    ignoreError: true,
  });

  await shifts.collection.updateOne({ _id: new ObjectId(id) }, {
    $set: {
      notificationId: null,
    }
  });
};

const upsertAll = async ({
  context,
  shiftId,
}: {
  context: IServiceContext;
  shiftId: string;
}) => {
  const allShifts = await context.shifts.collection.find({
    shiftId,
    removedAt: { $exists: false },
  }).toArray();
  await Promise.all(allShifts.map(async (shift) => {
    if (shift.userId) {
      await upsertNotification({ context, id: shift._id.toString() });
    }
  }));
};

const removeAll = async ({
  context,
  shiftId,
}: {
  context: IServiceContext;
  shiftId: string;
}) => {
  const allShifts = await context.shifts.collection.find({
    shiftId,
    $or: [
      { userId: null },
      { userId: { $exists: false } },
    ],
    removedAt: { $exists: false },
  }).toArray();
  await Promise.all(allShifts.map(async (shift) => {
    if (shift.notificationId) {
      await removeNotification({ context, id: shift._id.toString() });
    }
  }));
};

const shiftNotificationScheduler = async (event: BaseNotificationEvent) => {
  const context = await createContext();

  switch(event.action) {
    case ShiftNotificationAction.UpsertNotification:
      await upsertNotification({ context, id: (event as ShiftUpsertNotification).id });
      break;
    case ShiftNotificationAction.RemoveNotification:
      await removeNotification({ context, id: (event as ShiftRemoveNotification).id });
      break;
    case ShiftNotificationAction.UpsertAllNotifications:
      await upsertAll({ context, shiftId: (event as ShiftUpsertAllNotifications).shiftId });
      break;
    case ShiftNotificationAction.RemoveAllNotifications:
      await removeAll({ context, shiftId: (event as ShiftRemoveAllNotifications).shiftId });
      break;
    default:
      break;
  }
};

export const handler = middy(shiftNotificationScheduler)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
