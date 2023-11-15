import { Collection, Db } from 'mongodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { utcToZonedTime } from 'date-fns-tz';
import { DocType, Organization, Shift } from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import logger from '../utils/logger';
import { endOfDay, getDay, getHours, getMinutes, setHours, setMinutes } from 'date-fns';
import DataLoader from 'dataloader';
import { Action, MailerEvent, MailerEvents } from '../types/mailer';

const dayOfWeek = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday', // [6]
];

const lambda = new LambdaClient({});

export class ShiftModel extends BaseModel<Shift> {
  lotteryCounterCollection: Collection;

  public loadOneShiftFromGroup = new DataLoader(async (groupKeys: readonly string[]) => {
    const res = await this.collection.aggregate([
      {
        $match: {
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

  public loadOtherShiftSlots = new DataLoader(async (groupKeys: readonly string[]) => {
    const res = await this.collection.find({
      shiftId: { $in: groupKeys },
    }).sort({ _id: -1 }).toArray();

    const groupedByShiftId = res.reduce((acc, shift) => {
      if ((acc[shift.shiftId] || []).some((item) => item._id === shift._id)) {
        return acc;
      }
      acc[shift.shiftId] = acc[shift.shiftId] || [];
      shift.id = shift._id.toString();
      delete (shift as any)._id;
      acc[shift.shiftId].push(shift);
      return acc;
    }, {} as any);

    return groupKeys
      .map((key) =>
        groupedByShiftId[key]
          .map((item, index) => ({
            ...item,
            order: index + 1,
          }))
      );
  });

  constructor(db: Db) {
    super(db, DocType.Shift, 'shifts');
    this.lotteryCounterCollection = db.collection('lotteryCounter');
  }

  async notifyUsersOfShiftAvailability(shiftId: string, organization: Organization) {
    const emptyShifts = await this.collection.find({
      shiftId,
      $or: [
        { userId: null },
        { userId: { $exists: false } },
      ],
    }).toArray();
    
    if (emptyShifts.length > 0) {
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
    });

    if (shiftRes.deletedCount === 0) {
      logger.warn('No shifts removed', {
        orgId,
        eventId,
      });
    }
  }

  async removeAllByAssignmentId(orgId: string, assignmentId: string): Promise<void> {
    const shiftRes = await this.collection.deleteMany({
      orgId,
      assignmentId,
    });
    if (shiftRes.deletedCount === 0) {
      logger.warn('No shifts removed', {
        orgId,
        assignmentId,
      });
    }
  }

  async getAllShiftsById(shiftId: string): Promise<Shift[]> {
    const shifts = await this.collection.find({
      shiftId,
    }).toArray();
    return shifts.map((shift) => ({
      ...shift,
      id: shift._id.toString(),
    } as any)) as Shift[];
  }

  async getByShiftId(shiftId: string): Promise<Shift | null> {
    return this.findOne({
      shiftId,
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
          from: 'events',
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
    let lotteryCounterDoc: any = await this.lotteryCounterCollection.findOne({
      orgId,
    });
    if (!lotteryCounterDoc) {
      lotteryCounterDoc = {
        counter: 0,
      };
    }

    const pipeline = [
      // Filter for only open shifts
      {
        $match: {
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
          from: 'events',
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
          'event.status': 'READY_FOR_LOTTERY',
          'event.lotteryNumber': lotteryCounterDoc.counter,
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
