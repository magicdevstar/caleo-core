import { Db } from 'mongodb';
import { utcToZonedTime } from 'date-fns-tz';
import { DocType, Shift } from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import logger from '../utils/logger';
import { endOfDay, getDay, getHours, getMinutes, setHours, setMinutes } from 'date-fns';
import DataLoader from 'dataloader';

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
  public loadOneShiftFromGroup = new DataLoader(async (groupKeys: readonly string[]) => {
    const res = await this.collection.aggregate([
      {
        $match: {
          docType: DocType.Shift,
          shiftId: { $in: groupKeys },
        }
      },
      {
        $group: {
          _id: "$shiftId",
          shift: {
            $first: "$$ROOT"
          }
        }
      },
      {
        $replaceRoot: {
          newRoot: "$shift"
        }
      }
    ]).toArray();
    return groupKeys.map((key) => res.find((item: any) => item.shiftId === key));
  });

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
      docType: DocType.Shift,
    });
  }

  async findOpenLotteryShifts({
    orgId,
  }: {
    orgId: string;
  }) {
    // TODO: Ensure user is qualified for the shift :)
    const pipeline = [
      // Filter for only open shifts
      {
        $match: {
          docType: 'SHIFT',
          orgId,
          $and: [
            {
              $or: [
                { userId: null },
                { userId: { $exists: false } },
              ],
            },
            {
              $or: [
                { locked: false },
                { locked: { $exists: false } },
              ],
            }
          ],
        },
      },
      // Convert eventId to objectId
      {
        $addFields: {
          eventId: { $toObjectId: '$eventId' }
        }
      },
      {
        $lookup: {
          from: 'core',
          localField: 'eventId',
          foreignField: '_id',
          as: 'event'
        }
      },
      {
        $group: {
          _id: '$eventId',
          event: {
            $first: { $arrayElemAt: ['$event', 0] }
          },
          shifts: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          'event.status': 'READY_FOR_LOTTERY'
        }
      },
      { $unwind: { path: '$shifts' } },
      { $replaceRoot: { newRoot: '$shifts' } },
      {
        $addFields: {
          eventId: { $toString: '$eventId' }
        }
      },
      {
        $group: {
          _id: '$shiftId',
          shift: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$shift' } }
    ];
    const res = await this.collection.aggregate<Shift>(pipeline).toArray();
    const totalRes = await this.collection.aggregate<{
      total: number;
    }>([
      ...pipeline,
      {
        $count: 'total',
      },
    ]);

    logger.info('Res', { totalRes, res });

    return {
      items: res,
      total: totalRes?.[0]?.total || 0,
    };
  }

  async findOpenLotteryShiftsGroupedById({
    orgId,
  }: {
    orgId: string;
  }) {
    const pipeline = [
      // Filter for only open shifts
      {
        $match: {
          docType: 'SHIFT',
          orgId,
          $and: [
            {
              $or: [
                { userId: null },
                { userId: { $exists: false } },
              ],
            },
            {
              $or: [
                { locked: false },
                { locked: { $exists: false } },
              ],
            }
          ],
        },
      },
      // Convert eventId to objectId
      {
        $addFields: {
          eventId: { $toObjectId: '$eventId' }
        }
      },
      {
        $lookup: {
          from: 'core',
          localField: 'eventId',
          foreignField: '_id',
          as: 'event'
        }
      },
      {
        $group: {
          _id: '$eventId',
          event: {
            $first: { $arrayElemAt: ['$event', 0] }
          },
          shifts: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          'event.status': 'READY_FOR_LOTTERY'
        }
      },
      { $unwind: { path: '$shifts' } },
      { $replaceRoot: { newRoot: '$shifts' } },
      {
        $addFields: {
          eventId: { $toString: '$eventId' }
        }
      },
      {
        $group: {
          _id: '$shiftId',
          shifts: { $push: '$$ROOT' }
        }
      },
    ];
    const res = await this.collection.aggregate<{
      _id: string;
      shifts: Shift[];
    }>(pipeline).toArray();

    logger.info('Res', { res });

    return {
      items: res,
    };
  }
};
