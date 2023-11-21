
import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { v4 as uuid } from 'uuid';

import logger from '../utils/logger';
import { Context, createContext } from '../utils/createContext';
import {
  BaseNotificationEvent,
  NotificationType,
  ShiftNotificationAction,
  ShiftRemoveAllNotifications,
  ShiftRemoveNotification,
  ShiftUpsertAllNotifications,
  ShiftUpsertNotification
} from '../types/notifications';
import { ScheduleEvent } from '../models/scheduler';
import { ObjectId } from 'mongodb';
import { utcToZonedTime } from 'date-fns-tz';
import { format, subHours } from 'date-fns';

const upsertNotification = async ({
  context: { scheduler, shifts, organizations },
  id,
} : {
  context: Context;
  id: string;
}) => {
  const shift = await shifts.get(id);
  if (!shift || !shift.userId) {
    return;
  }
  const organization = await organizations.get(shift.orgId);
  const eventId = shift.notificationId || uuid();
  const payload = {
    action: NotificationType.Shift,
    eventId,
    shift: {
      id,
      userId: shift.userId,
    },
  };
  // TODO: Get user preference for shift reminder
  const reminderHours = organization?.settings?.shiftReminder.time || 24;
  const tz = organization?.timezone || 'America/Los_Angeles';

  const shiftNotificationTime = subHours(new Date(shift.startTime), reminderHours);
  const zonedDate = utcToZonedTime(shiftNotificationTime, tz);

  await scheduler.updateScheduledEvent({
    event: ScheduleEvent.SHIFT_REMINDER,
    orgId: shift.orgId,
    eventTime: `at(${format(zonedDate, 'yyyy-MM-dd&&hh:mm:ss').replace('&&','T')})`,
    eventTimeZone: tz as any,
    customEventName: eventId,
    eventInput: JSON.stringify(payload),
  });

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
  context: Context;
  id: string;
}) => {
  const shift = await shifts.get(id);
  if (!shift || !shift.notificationId) {
    return;
  }
  await scheduler.removeSchedule({
    customEventName: shift.notificationId,
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
  context: Context;
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
  context: Context;
  shiftId: string;
}) => {
  const allShifts = await context.shifts.collection.find({
    shiftId,
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
