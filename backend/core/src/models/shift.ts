import { Collection, Db } from 'mongodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { utcToZonedTime } from 'date-fns-tz';
import { DayOfWeek, DocType, Organization, Shift, ShiftSearchInput, ShiftStatus, User } from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import logger from '../utils/logger';
import { endOfDay, getDay, getHours, getMinutes, setHours, setMinutes } from 'date-fns';
import DataLoader from 'dataloader';
import { Action, MailerEvent, MailerEvents } from '../types/mailer';
import { LotteryCounterModel } from './lotteryCounter';
import { userIsAdmin } from '../utils/access';
import { SearchResults } from '../utils/common.resolvers';

const dayOfWeek = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday', // [6]
];

export interface ShiftSearchExtended extends ShiftSearchInput {
  orgId: string;
  requestingUser: User;
}

const lambda = new LambdaClient({});

export class ShiftModel extends BaseModel<Shift> {
  eventsCollection: Collection;

  public loadOneShiftFromGroup = new DataLoader(async (groupKeys: readonly string[]) => {
    const res = await this.collection.aggregate(JSON.parse(JSON.stringify([
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
    ]))).toArray();
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
          $or: [{userId: null}, {userId: {$exists: false}}],
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

  async highestRefNumber(shiftId: string) {
    try {
      const res = await this.collection
        .find({ shiftId })
        .sort({ refNumber: -1 })
        .limit(1)
        .toArray();
      return res[0]?.refNumber || null;
    } catch(error) {
      logger.warn('Could not find highest shift ref number', { shiftId });
      return null;
    }
  }

  async notifyUsersOfEventAvailability(eventId: string, organization: Organization) {
    const emptyShifts = await this.collection.find({
      eventId,
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
          template: MailerEvents.OfficerFcfsEventAvailable,
          data: {
            eventId,
            organization,
          },
        } as MailerEvent),
      }));
    }
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
      status: { $in: [ShiftStatus.Assigned, ShiftStatus.Available, ShiftStatus.Locked] }
    }, {
      modifiedById,
      status: ShiftStatus.Removed,
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
      status: { $in: [ShiftStatus.Assigned, ShiftStatus.Available, ShiftStatus.Locked] }
    }, {
      modifiedById,
      status: ShiftStatus.Removed,
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

  async dynamicSearch(input: ShiftSearchExtended): Promise<SearchResults<Shift>> {
    const {
      skip,
      limit,
      order,
      orderBy,
      range,
      query,
      queryField,
      startTime,
      endTime,
      userId,
      createdById,
      requestingUser,
      daysOfWeek,
      includeRemoved,
      assignedIds,
      eventIds,
      rankIds,
      skillIds,
      status,
      refNumber,
      ...matchInput
    } = input;

    if (createdById) {
      (matchInput as any).createdById = { $in: createdById };
    }

    if (eventIds) {
      (matchInput as any).eventId = { $in: eventIds };
    }

    if (refNumber) {
      try {
        (matchInput as any).refNumber = parseInt(refNumber, 10);
      } catch(error) {
        (matchInput as any).refNumber = -1;
      }
    }

    // const realStatuses = (status || []).filter((s) => [ShiftStatus.Assigned].includes(s || ''));

    // Find set of assigned users if requester is admin
    if (assignedIds && userIsAdmin(requestingUser)) {
      (matchInput as any).userId = { $in: assignedIds };
    // Find set user assignments if requester is admin and the userId provided does not match the requesting user
    } else if (userId !== requestingUser?.id && userIsAdmin(requestingUser)) {
      (matchInput as any).userId = userId;
    } else {
      (matchInput as any).userId = requestingUser?.id;
    }

    if (range) {
      const { startTime, endTime, removedAt } = range;
      if (startTime && startTime.value) {
        (matchInput as any).startTime = new Date(startTime.value).getTime();
      } else if (startTime && (startTime.gte || startTime?.lte)) {
        (matchInput as any).startTime = {
          ...(startTime.gte ? { $gte: new Date(startTime.gte).getTime() } : {}),
          ...(startTime.lte ? { $lte: new Date(startTime.lte).getTime() } : {}),
        };
      }

      if (endTime && endTime.value) {
        (matchInput as any).endTime = new Date(endTime.value).getTime();
      } else if (endTime && (endTime.gte || endTime?.lte)) {
        (matchInput as any).endTime = {
          ...(endTime.gte ? { $gte: new Date(endTime.gte).getTime() } : {}),
          ...(endTime.lte ? { $lte: new Date(endTime.lte).getTime() } : {}),
        };
      }

      if (removedAt && removedAt.value) {
        (matchInput as any).removedAt = new Date(removedAt.value).getTime();
      } else if (removedAt && (removedAt.gte || removedAt?.lte)) {
        (matchInput as any).removedAt = {
          ...(removedAt.gte ? { $gte: new Date(removedAt.gte).getTime() } : {}),
          ...(removedAt.lte ? { $lte: new Date(removedAt.lte).getTime() } : {}),
        };
      }
    } else if (startTime || endTime) {
      if (startTime) {
        (matchInput as any).endTime = {
          $gte: new Date(startTime).getTime(),
        };
      } else if (endTime) {
        (matchInput as any).startTime = {
          $lte: new Date(endTime).getTime(),
        };
      }
    }

    if (daysOfWeek) {
      const $or = daysOfWeek.map((day: DayOfWeek) => ({
        [`availability.${day.toLowerCase()}.startTime`]: { $exists: true },
      }));
      (matchInput as any).$and = [{$or}];
    }

    if (!includeRemoved) {
      (matchInput as any).removedAt = { $exists: false };
    }

    if (status) {
      (matchInput as any).status = { $in: status };
      if (
        status.includes(ShiftStatus.Relinquished) ||
        status.includes(ShiftStatus.Removed) ||
        status.includes(ShiftStatus.Unassigned)
      ) {
        delete (matchInput as any).removedAt;
      }
    }

    const pipeline: any = [
      {
        $match: matchInput,
      },
    ];

    if (rankIds || skillIds) {
      pipeline.push({
        $addFields:
          {
            assignmentId: {
              $toObjectId: "$assignmentId",
            },
          },
      },
      {
        $lookup:
          {
            from: "assignments",
            localField: "assignmentId",
            foreignField: "_id",
            as: "assignment",
          },
      },
      {
        $addFields:
          {
            user: {
              $arrayElemAt: ["$assignment", 0],
            },
          },
      });

      let assignmentMatch: any = {
        $match: {},
      };

      if (rankIds) {
        assignmentMatch.$match["assignment.rankIds"] = { $in: rankIds };
      }
      if (skillIds) {
        assignmentMatch.$match["assignment.requiredSkillIds"] = { $in: skillIds };
      }
      pipeline.push(assignmentMatch);
    }

    if (order && orderBy) {
      pipeline.push({
        $sort: { [orderBy]: order === 'asc' ? 1 : -1 },
      });
    } else {
      pipeline.push({
        $sort: { _id: -1 },
      });
    }

    const totalPipeline = JSON.parse((JSON.stringify(pipeline)));
    totalPipeline.push({
      $count: "total",
    });

    if (skip) {
      pipeline.push({
        $skip: skip,
      });
    }
    if (limit) {
      pipeline.push({
        $limit: limit,
      });
    }

    logger.info('Dynamic Shift Pipeline', {
      input,
      pipeline,
      totalPipeline,
    });

    const itemResult = await this.collection.aggregate(JSON.parse(JSON.stringify(pipeline))).toArray();
    const totalResult = await this.collection.aggregate(totalPipeline).toArray();

    logger.info('Dynamic Shift Result', {
      itemResult,
      totalResult,
    });

    return {
      items: itemResult.map(({_id, assignmentId, ...item}) => ({
        ...item,
        assignmentId: typeof assignmentId === 'string' ? assignmentId : assignmentId.toString(),
        id: _id.toString(),
      })) as any,
      total: totalResult.length > 0 ? totalResult[0].total : 0,
    };
  }
};
