import { Db } from 'mongodb';
import { utcToZonedTime } from 'date-fns-tz';
import { DocType, Shift } from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import logger from '../utils/logger';
import { endOfDay, getDay, getHours, getMinutes, setHours, setMinutes } from 'date-fns';

const dayOfWeek = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday', // [6]
];

export class ShiftModel extends BaseModel<Shift> {
  constructor(db: Db) {
    super(db, DocType.Shift);
  }

  createAvailability(shift: Shift, timezone: string) {
    const startTime = utcToZonedTime(new Date(shift.startTime), timezone);
    const endTime = utcToZonedTime(new Date(shift.endTime), timezone);

    const startDay = getDay(startTime);
    const endDay = getDay(endTime);

    const inBetweenDays: number[] = [];
    if (startDay !== endDay) {
      let inBetween = startDay + 1;
      while(inBetween !== endDay) {
        inBetweenDays.push(inBetween);
        inBetween = ((inBetween + 1) % dayOfWeek.length);
      }
    }

    return dayOfWeek.reduce((acc, day, index) => {
      acc[day] = {};
      if (index === startDay) {
        if (endDay !== startDay) {
          acc[day].endTime = endOfDay(new Date(0));
        }
        const withHoursSet = setHours(new Date(0), getHours(startTime));
        const withMinutesSet = setMinutes(withHoursSet, getMinutes(startTime));
        acc[day].startTime = withMinutesSet;
      }
      if (index === endDay) {
        if (endDay !== startDay) {
          acc[day].startTime = new Date(0);
        }
        const withHoursSet = setHours(new Date(0), getHours(endTime));
        const withMinutesSet = setMinutes(withHoursSet, getMinutes(endTime));
        acc[day].endTime = withMinutesSet;
      }
      if (inBetweenDays.includes(index)) {
        acc[day] = {
          startTime: new Date(0),
          endTime: endOfDay(new Date(0)),
        };
      }
      if (index !== startDay && index !== endDay && !inBetweenDays.includes(index)) {
        acc[day] = null;
      }
      return acc;
    }, {} as any);
  }

  async removeAllByEventId(orgId: string, eventId: string): Promise<void> {
    const shiftRes = await this.collection.deleteMany({
      orgId,
      eventId,
      docType: DocType.Shift,
    });

    if (shiftRes.deletedCount === 0) {
      logger.warn('No shifts removed', {
        orgId,
        eventId,
        docType: DocType.Shift,
      });
    }
  }

  async removeAllByAssignmentId(orgId: string, assignmentId: string): Promise<void> {
    const shiftRes = await this.collection.deleteMany({
      orgId,
      docType: DocType.Shift,
      assignmentId,
    });
    if (shiftRes.deletedCount === 0) {
      logger.warn('No shifts removed', {
        orgId,
        docType: DocType.Shift,
        assignmentId,
      });
    }
  }

  async getByShiftId(shiftId: string): Promise<Shift | null> {
    return this.findOne({
      shiftId,
    });
  }
};
