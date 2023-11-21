import { Collection, Db } from 'mongodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { utcToZonedTime } from 'date-fns-tz';
import { DocType, Organization, Shift } from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import logger from '../utils/logger';
import { endOfDay, getDay, getHours, getMinutes, setHours, setMinutes } from 'date-fns';
import DataLoader from 'dataloader';
import { Action, MailerEvent, MailerEvents } from '../types/mailer';
import { LotteryCounterModel } from './lotteryCounter';

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
  eventsCollection: Collection;

  public loadOneShiftFromGroup = new DataLoader(async (groupKeys: readonly string[]) => {
    const res = await this.collection.aggregate([
      {
        $match: {
          shiftId: { $in: groupKeys },
          removedAt: { $exists: false },
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
      removedAt: { $exists: false },
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

  public eventShiftCount = new DataLoader(async (keys: readonly string[]) => {
    const res = await this.collection.aggregate<{
      _id: string;
      count: number;
    }>([
      {
        $match: {
          eventId: {
            $in: keys,
          },
          removedAt: { $exists: false },
        },
      },
      {
        $group: {
          _id: "$eventId",
          count: {
            $count: {},
          },
        },
      },
    ]).toArray();

    return keys.map((key) => res.find((item) => item._id === key)?.count || 0);
  });

  constructor(db: Db, private lotteryCounter: LotteryCounterModel) {
    super(db, DocType.Shift, 'shifts');
    this.eventsCollection = db.collection('events');
  }

  async notifyUsersOfShiftAvailability(shiftId: string, organization: Organization) {
    const emptyShifts = await this.collection.find({
      shiftId,
      removedAt: { $exists: false },
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

  async removeAllByEventId(orgId: string, eventId: string, modifiedById: string): Promise<void> {
    const shiftRes = await this.removeMany({
      orgId,
      eventId,
    }, {
      modifiedById,
    });

    if (shiftRes.modifiedCount === 0) {
      logger.warn('No shifts removed', {
        orgId,
        eventId,
      });
    }
  }

  async removeAllByAssignmentId(orgId: string, assignmentId: string, modifiedById: string): Promise<void> {
    const shiftRes = await this.removeMany({
      orgId,
      assignmentId,
    }, {
      modifiedById,
    });
    if (shiftRes.modifiedCount === 0) {
      logger.warn('No shifts removed', {
        orgId,
        assignmentId,
      });
    }
  }

  async getAllShiftsById(shiftId: string): Promise<Shift[]> {
    const shifts = await this.collection.find({
      shiftId,
      removedAt: { $exists: false },
    }).toArray();
    return shifts.map((shift) => ({
      ...shift,
      id: shift._id.toString(),
    } as any)) as Shift[];
  }

  async getByShiftId(shiftId: string): Promise<Shift | null> {
    return this.findOne({
      shiftId,
      removedAt: { $exists: false },
    });
  }

  async findOpenLotteryShiftsGroupedById({
    orgId,
  }: {
    orgId: string;
  }) {
    const { counter } = await this.lotteryCounter.get(orgId);

    const pipeline = [
      {
        $match: {
          status: "READY_FOR_LOTTERY",
          lotteryNumber: counter,
          removedAt: { $exists: false },
        },
      },
      {
        $addFields: {
          eventId: {
            $toString: "$_id",
          },
        },
      },
      {
        $lookup: {
          from: "shifts",
          localField: "eventId",
          foreignField: "eventId",
          as: "shifts",
        },
      },
      {
        $unwind: {
          path: "$shifts",
        },
      },
      {
        $replaceRoot: {
          newRoot: "$shifts",
        },
      },
      {
        $match: {
          $and: [
            { removedAt: { $exists: false } },
            {
              $or: [
                { userId: null },
                {
                  userId: {
                    $exists: false,
                  },
                },
              ],
            },
            {
              $or: [
                { locked: false },
                {
                  locked: {
                    $exists: false,
                  },
                },
              ],
            },
          ],
        },
      },
      {
        $group: {
          _id: "$shiftId",
          shifts: {
            $push: "$$ROOT",
          },
        },
      },
    ];

    const res = await this.eventsCollection.aggregate<{
      _id: string;
      shifts: Shift[];
    }>(pipeline).toArray();

    logger.info('Res', { res });

    return {
      items: res,
    };
  }
};
