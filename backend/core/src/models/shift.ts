import { Collection, Db, ObjectId } from 'mongodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { utcToZonedTime } from 'date-fns-tz';
import { DayAvailability, DayOfWeek, DocType, EventStatus, Organization, Shift, ShiftCheckInOut, ShiftCheckInOutCoordinates, ShiftCheckInOutEquipment, ShiftSearchInput, ShiftStatus, User } from '../__generated__/resolvers-types';
import logger from '../utils/logger';
import { addHours, endOfDay, getDay, getHours, getMinutes, isAfter, setHours, setMilliseconds, setMinutes, setSeconds } from 'date-fns';
import DataLoader from 'dataloader';
import { Action, MailerEvent, MailerEvents } from '../types/mailer';
import { LotteryCounterModel } from './lotteryCounter';
import { userIsAdmin } from '../utils/access';
import { SearchResults } from '../utils/common.resolvers';
import { IOrganization } from './organizations/organization.entity';
import { IAssignmentShiftSlots, IUser } from '../types/common';
import { BaseMongo } from './base.v2';
import { IAssignment } from './assignment';
import { IEvent } from './event';

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
  orgId: ObjectId;
  requestingUser: IUser;
}

export interface IShiftCheckInOut extends Omit<
  ShiftCheckInOut,
  'checkInTime' |
  'checkOutTime' |
  'equipmentDetails' |
  '__typename'
> {
  checkInTime?: Date;
  checkOutTime?: Date;

  equipmentDetails: IShiftCheckInOutEquipment;
}

export interface IShiftCheckInOutEquipment extends Omit<
  ShiftCheckInOutEquipment,
  'checkInTime' |
  'checkOutTime' |
  '__typename'
> {
  checkInTime?: Date;
  checkOutTime?: Date;
}

export interface IShift extends Omit<
  Shift,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'orgId' |
  'org' |
  'assignment' |
  'assignmentId' |
  'createdBy' |
  'createdById' |
  'endTime' |
  'event' |
  'eventId' |
  'lotteryRequest' |
  'otherShiftSlots' |
  'shiftBufferShift' |
  'shiftCheckInOut' |
  'shiftInterestRequest' |
  'startTime' |
  'user' |
  'userId' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  orgId: ObjectId;
  modifiedById: ObjectId;
  createdById: ObjectId;
  assignmentId: ObjectId;
  eventId: ObjectId;
  userId?: ObjectId | null;
  docusignEnvelopeId?: string;

  order?: number;

  shiftCheckInOut?: IShiftCheckInOut;

  endTime: Date;
  startTime: Date;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export interface IShiftExpanded extends IShift {
  user?: IUser;
  assignment?: IAssignment;
  event?: IEvent;
}

export interface IShiftWithAssignment extends IShift {
  assignment: IAssignment;
  shiftBufferShift?: IShift;
}

const lambda = new LambdaClient({});

export class ShiftModel extends BaseMongo<IShift> {
  eventsCollection: Collection;
  lottoShiftRequestCollection: Collection;

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
    const res = await this.collection.find<IShift>({
      shiftId: { $in: groupKeys },
      removedAt: { $exists: false },
    }).sort({ _id: -1 }).toArray();

    const groupedByShiftId = res.reduce((acc, shift) => {
      if ((acc[shift.shiftId] || []).some((item) => item._id === shift._id)) {
        return acc;
      }
      acc[shift.shiftId] = acc[shift.shiftId] || [];
      shift.id = shift._id!.toString();
      acc[shift.shiftId].push(shift);
      return acc;
    }, {} as Record<string, IShift[]>);

    return groupKeys
      .map((key) =>
        groupedByShiftId[key]
          .map((item, index) => ({
            ...item,
            order: index + 1,
          }))
      );
  });

  public availableShiftsOnEvent: DataLoader<string, number, string>;
  public totalShiftsOnEvent: DataLoader<string, number, string>;

  public availableShiftsOnAssignment: DataLoader<string, number, string>;
  public totalShiftsOnAssignment: DataLoader<string, number, string>;

  public shiftCountLoader = new DataLoader(async (keys: readonly {id: string; orgId: string; beginningOfWeek: Date; endOfWeek: Date;}[]) => {
    const beginningOfWeek = keys[0].beginningOfWeek;
    const endOfWeek = keys[0].endOfWeek;
    const orgId = new ObjectId(keys[0].orgId);
    const userIds = keys.map(({ id }) => new ObjectId(id));
    const res = await this.collection.aggregate<{
      _id: ObjectId;
      count: number;
    }>([
      {
        $match: {
          orgId,
          userId: {
            $in: userIds,
          },
          startTime: {
            $gte: beginningOfWeek,
          },
          endTime: {
            $lte: endOfWeek,
          },
          removedAt: {
            $exists: false,
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          count: {
            $count: {},
          },
        },
      },
    ]).toArray();
    
    return keys.map((key) => res.find((item: any) => item._id.toString() === key.id) || { count: 0 }).map(({ count }: any) => count);
  });

  public shiftHoursLoader = new DataLoader(async (keys: readonly {id: string; orgId: string; beginningOfMonth: Date; endOfMonth: Date;}[]) => {
    const beginningOfMonth = keys[0].beginningOfMonth;
    const endOfMonth = keys[0].endOfMonth;
    const orgId = new ObjectId(keys[0].orgId);
    const userIds = keys.map(({ id }) => new ObjectId(id));
    const query = {
      userId: {
        $in: userIds,
      },
      orgId,
      status: ShiftStatus.Assigned,
      startTime: {
        $gte: beginningOfMonth,
        $lte: endOfMonth,
      }
    };
    const allShifts = await this.collection.find<IShift>(query).toArray();
    const shiftsGroupedByUser = allShifts.reduce((acc, shift) => {
      if (shift.userId) {
        acc[shift.userId.toString()] = acc[shift.userId.toString()] || [];
        acc[shift.userId.toString()].push(shift);
      }
      return acc;
    }, {} as Record<string, IShift[]>);
    const res: Record<string, number> = {};
    for (const key of Object.keys(shiftsGroupedByUser)) {
      const allShifts = shiftsGroupedByUser[key];
      const totalMilliseconds = allShifts.reduce((total, {
        startTime,
        endTime,
        shiftCheckInOut
      }) => {
        let milliseconds = endTime.getTime() - startTime.getTime();
        if (shiftCheckInOut?.checkInTime && shiftCheckInOut?.checkOutTime) {
          milliseconds = shiftCheckInOut.checkOutTime.getTime() - shiftCheckInOut.checkInTime.getTime();
        }
  
        return total + milliseconds;
      }, 0);
  
      const totalHours = Math.floor(totalMilliseconds / 3600000);
      res[key] = totalHours;
    }
    
    return keys.map((key) => res[key.id] || 0);
  });

  public weekShiftsLoader = new DataLoader(async (keys: readonly {id: string; orgId: string; beginningOfWeek: Date; endOfWeek: Date;}[]) => {
    const beginningOfWeek = keys[0].beginningOfWeek;
    const endOfWeek = keys[0].endOfWeek;
    const orgId = new ObjectId(keys[0].orgId);
    const userIds = keys.map(({ id }) => new ObjectId(id));
    const res = await this.collection.aggregate<{
      _id: ObjectId;
      shifts: IShift[];
    }>([
      {
        $match: {
          orgId,
          userId: {
            $in: userIds,
          },
          startTime: {
            $gte: beginningOfWeek,
          },
          endTime: {
            $lte: endOfWeek,
          },
          removedAt: {
            $exists: false,
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          shifts: { $push: '$$ROOT' },
        },
      },
    ]).toArray();
    
    return keys
      .map((key) =>
        res
          .find((item) => item._id.toString() === key.id) || { shifts: [] as IShift[] })
          .map(({ shifts }) => shifts);
  });

  constructor(db: Db, private lotteryCounter: LotteryCounterModel) {
    super(db, DocType.Shift, 'shifts');
    this.eventsCollection = db.collection('events');
    this.lottoShiftRequestCollection = db.collection('shiftLotteryRequests');

    const shiftCounter = (level: 'eventId' | 'assignmentId', includeAssignedShifts: boolean) => new DataLoader(async (keys: readonly string[]) => {
      const res = await this.collection.aggregate<{
        _id: ObjectId;
        count: number;
      }>([
        {
          $match: {
            [level]: {
              $in: keys.map((id) => new ObjectId(id)),
            },
            removedAt: { $exists: false },
            ...(includeAssignedShifts ? {} : {
              $or: [{userId: null}, {userId: {$exists: false}}]
            }),
          },
        },
        {
          $group: {
            _id: `$${level}`,
            count: {
              $count: {},
            },
          },
        },
      ]).toArray();

      logger.info('Shift counter results', { res, keys });
  
      return keys.map((key) => res.find((item) => item._id.toString() === key)?.count || 0);
    });
    this.availableShiftsOnEvent = shiftCounter('eventId', false);
    this.totalShiftsOnEvent = shiftCounter('eventId', true);

    this.availableShiftsOnAssignment = shiftCounter('assignmentId', false);
    this.totalShiftsOnAssignment = shiftCounter('assignmentId', true);
  }

  async setDocusignEnvelopeId({
    _id,
    envelopeId
  }: {
    _id: ObjectId;
    envelopeId: string;
  }) {
    await this.collection.updateOne({
      _id,
    }, {
      $set: {
        docusignEnvelopeId: envelopeId,
        updatedAt: new Date(),
      },
    });
  }

  async editCheckInOut({
    id,
    checkInTime,
    checkOutTime,
    checkInEquipmentTime,
    checkOutEquipmentTime,
    adminNotes,
    noShow,
    user,
  } : {
    id: string,
    checkInTime?: string | null,
    checkOutTime?: string | null,
    adminNotes?: string | null,
    checkInEquipmentTime?: string | null,
    checkOutEquipmentTime?: string | null,
    noShow: boolean,
    user: IUser,
  }) {
    const res = await this.collection.updateOne({
      _id: new ObjectId(id),
    }, {
      $set: {
        modifiedById: user._id!,
        updatedAt: new Date(),
        'shiftCheckInOut.noShow': noShow,
        ...(checkInTime ? { 'shiftCheckInOut.checkInTime': new Date(checkInTime) } : {}),
        ...(checkOutTime ? { 'shiftCheckInOut.checkOutTime': new Date(checkOutTime) } : {}),
        ...(adminNotes ? { 'shiftCheckInOut.adminNotes': adminNotes } : {}),
        ...(checkInEquipmentTime ? { 'shiftCheckInOut.equipmentDetails.checkInTime': new Date(checkInEquipmentTime) } : {}),
        ...(checkOutEquipmentTime ? { 'shiftCheckInOut.equipmentDetails.checkOutTime': new Date(checkOutEquipmentTime) } : {}),
      },
    });

    return this.get(id);
  }

  async checkIn({
    id,
    coords,
    time,
    checkInNote,
    adminNotes,
    equipmentTime,
    user
  } : {
    id: string,
    coords?: ShiftCheckInOutCoordinates,
    time?: Date,
    checkInNote?: string,
    adminNotes?: string,
    equipmentTime?: string,
    user: IUser,
  }) {
    await this.collection.updateOne({
      _id: new ObjectId(id),
    }, {
      $set: {
        modifiedById: user._id!,
        updatedAt: new Date(),
        'shiftCheckInOut.checkInTime': time || new Date(),
        ...(checkInNote ? { 'shiftCheckInOut.checkInNote': checkInNote } : {}),
        ...(adminNotes ? { 'shiftCheckInOut.adminNotes': adminNotes } : {}),
        ...(coords ? { 'shiftCheckInOut.checkInCoords': coords } : {}),
        ...(equipmentTime ? { 'shiftCheckInOut.equipmentDetails.checkInTime': new Date(equipmentTime) } : {}),
      },
    });
  }

  async checkOut({
    id,
    coords,
    time,
    checkOutNote,
    adminNotes,
    user,
    equipmentTime,
  } : {
    id: string,
    coords?: ShiftCheckInOutCoordinates,
    time?: Date,
    checkOutNote?: string,
    adminNotes?: string,
    user: IUser,
    equipmentTime?: string,
  }) {
    await this.collection.updateOne({
      _id: new ObjectId(id),
    }, {
      $set: {
        modifiedById: user._id!,
        updatedAt: new Date(),
        'shiftCheckInOut.checkOutTime': time || new Date(),
        ...(checkOutNote ? { 'shiftCheckInOut.checkOutNote': checkOutNote } : {}),
        ...(adminNotes ? { 'shiftCheckInOut.adminNotes': adminNotes } : {}),
        ...(coords ? { 'shiftCheckInOut.checkOutCoords': coords } : {}),
        ...(equipmentTime ? { 'shiftCheckInOut.equipmentDetails.checkOutTime': new Date(equipmentTime) } : {}),
      },
    });
  }

  async highestRefNumber(eventId: string) {
    try {
      const res = await this.collection
        .find<IShift>({ eventId: new ObjectId(eventId) })
        .sort({ refNumber: -1 })
        .limit(1)
        .toArray();
      return res[0]?.refNumber || null;
    } catch(error) {
      logger.warn('Could not find highest shift ref number', { eventId });
      return null;
    }
  }

  async notifyUsersOfEventAvailability(eventId: string, organization: Organization | IOrganization) {
    const emptyShifts = await this.collection.find<IShift>({
      eventId: new ObjectId(eventId),
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

  async notifyUsersOfEventInterestAvailability(
    eventId: string,
    organization: Organization | IOrganization,
    mailerTemplate: MailerEvents.OfficerInterestListOpening | MailerEvents.OfficerInterestListClosing,
  ) {
    const emptyShifts = await this.collection.find<IShift>({
      eventId: new ObjectId(eventId),
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
          template: mailerTemplate,
          data: {
            eventId,
            organization,
          },
        } as MailerEvent),
      }));
    }
  }

  async canSignUpForShift({
    user,
    shift,
    orgId,
    shiftBufferTime = 0,
  }: {
    user: User | IUser;
    shift: IShift;
    orgId: string;
    shiftBufferTime?: number;
  }) {
    const res: {
      canSignUpForShift: boolean;
      requiresShiftBuffer: boolean;
      shiftBuffer?: IShift;
    } = {
      canSignUpForShift: false,
      requiresShiftBuffer: false,
    }
    const bufferOffset = shiftBufferTime * 60 * 1000;
    const available = Object.keys(user.member.availability).reduce((isAvailable: boolean, day: string) => {
      if (!isAvailable || !shift.availability?.[day]) return isAvailable;
      const { available, times } = user.member.availability[day] as DayAvailability;
      if (!available && shift.availability?.[day]) {
        return false;
      }
      if (times?.length === 0) return true;
      return (times || []).some(({ startTime, endTime }) => {
        const originalStartTime = new Date(startTime);
        const originalEndTime = new Date(endTime);
    
        const start = setSeconds(setMilliseconds(setMinutes(setHours(new Date(0), getHours(originalStartTime)), getMinutes(originalStartTime)), 0), 0);
        const end = setSeconds(setMilliseconds(setMinutes(setHours(new Date(0), getHours(originalEndTime)), getMinutes(originalEndTime)), 999), 59);

        return (
          (shift.availability?.[day]?.startTime && new Date(shift.availability?.[day]?.startTime).getTime() >= start.getTime()) &&
          (shift.availability?.[day]?.endTime && new Date(shift.availability?.[day]?.endTime).getTime() <= end.getTime())
        );
      });
    }, true);

    if (!available) {
      return res;
    }

    const $or = [
      // Case 1: The interval completely covers the start date and end date
      // Ex. 👇
      //     S                E 
      //     |****************|
      //  S1                     E1
      //  |----------------------| 
      {
        $and: [
          { startTime: { $lte: new Date(shift.startTime.getTime() - bufferOffset) } },
          { endTime: { $gte: new Date(shift.endTime.getTime() + bufferOffset) } }
        ],
      },
      // Case 2: The interval is completely inside the start date and end date
      // Ex. 👇
      //     S                E 
      //     |****************|
      //       S2        E2
      //       |----------|
      {
        $and: [
          { startTime: { $gte: new Date(shift.startTime.getTime() - bufferOffset) } },
          { endTime: { $lte: new Date(shift.endTime.getTime() + bufferOffset) } }
        ],
      },
      // Case 3: The start date is outside the interval and the end date is inside the interval
      // Ex. 👇
      //     S                E 
      //     |****************|
      // S3          E3
      // |-----------|
      {
        $and: [
          { endTime: { $gte: new Date(shift.startTime.getTime() - bufferOffset) } },
          { endTime: { $lte: new Date(shift.endTime.getTime() + bufferOffset) } }
        ],
      },
      // Case 4: The start date is inside the interval and the end date is outside the interval
      //     S                E 
      //     |****************|
      //              S4           E4
      //              |-------------|
      {
        $and: [
          { startTime: { $gte: new Date(shift.startTime.getTime() - bufferOffset) } },
          { startTime: { $lte: new Date(shift.endTime.getTime() + bufferOffset) } }
        ],
      },
    ];

    const query = {
      orgId: new ObjectId(orgId),
      userId: new ObjectId(user.id),
      removedAt: { $exists: false },
      $or,
    };
    const foundOverlap = await this.collection.findOne<IShift>(query);

    res.canSignUpForShift = !foundOverlap;

    if(
      foundOverlap &&
      !(
        (foundOverlap.startTime.getTime() > shift.startTime.getTime() && foundOverlap.startTime.getTime() < shift.endTime.getTime()) ||
        (foundOverlap.endTime.getTime() > shift.startTime.getTime() && foundOverlap.endTime.getTime() < shift.endTime.getTime() + 1) ||
        (foundOverlap.startTime.getTime() === shift.startTime.getTime() && foundOverlap.endTime.getTime() === shift.endTime.getTime())
      )
    ) {
      res.requiresShiftBuffer = true;
      foundOverlap.id = foundOverlap._id!.toString();
      res.shiftBuffer = foundOverlap;
    }

    return res;
  }

  async notifyUsersOfShiftAvailability(shiftId: string, organization: IOrganization) {
    const emptyShifts = await this.collection.find<IShift>({
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

  createAvailability(shift: IShift, timezone: string) {
    const startTime = utcToZonedTime(shift.startTime, timezone);
    const endTime = utcToZonedTime(shift.endTime, timezone);
  
    const startDay = getDay(startTime);
    const endDay = getDay(endTime);
  
    const inBetweenDays: number[] = [];
    if (startDay !== endDay) {
      let inBetween = (startDay + 1) % dayOfWeek.length;
      while(inBetween !== endDay) {
        inBetweenDays.push(inBetween);
        inBetween = ((inBetween + 1) % dayOfWeek.length);
      }
    }
  
    return dayOfWeek.reduce((acc, day, index) => {
      acc[day] = {} as {startTime: Date; endTime: Date;};
      if (index === startDay) {
        if (endDay !== startDay) {
          acc[day]!.endTime = endOfDay(new Date(0));
        }
        const withHoursSet = setHours(new Date(0), getHours(startTime));
        const withMinutesSet = setMinutes(withHoursSet, getMinutes(startTime));
        acc[day]!.startTime = withMinutesSet;
      }
      if (index === endDay) {
        if (endDay !== startDay) {
          acc[day]!.startTime = new Date(0);
        }
        const withHoursSet = setHours(new Date(0), getHours(endTime));
        const withMinutesSet = setMinutes(withHoursSet, getMinutes(endTime));
        acc[day]!.endTime = withMinutesSet;
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
    }, {} as Record<string, {startTime: Date; endTime: Date;} | null>);
  }

  async removeAllByEventId(orgId: string, eventId: string, modifiedById: string): Promise<void> {
    const shiftRes = await this.removeMany({
      orgId: new ObjectId(orgId),
      eventId: new ObjectId(eventId),
      status: { $in: [ShiftStatus.Assigned, ShiftStatus.Available, ShiftStatus.Locked] }
    }, {
      modifiedById: new ObjectId(modifiedById),
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
      orgId: new ObjectId(orgId),
      assignmentId: new ObjectId(assignmentId),
      status: { $in: [ShiftStatus.Assigned, ShiftStatus.Available, ShiftStatus.Locked] }
    }, {
      modifiedById: new ObjectId(modifiedById),
      status: ShiftStatus.Removed,
    });
    if (shiftRes.modifiedCount === 0) {
      logger.warn('No shifts removed', {
        orgId,
        assignmentId,
      });
    }
  }

  updateByShiftGroupId(shiftId: string, updates: any) {
    return this.collection.updateMany(
      {
        shiftId,
      }, {
        $set: updates,
      }
    );
  }

  async getAllShiftsById(shiftId: string): Promise<IShift[]> {
    const shifts = await this.collection.find<IShift>({
      shiftId,
      removedAt: { $exists: false },
    }).toArray();
    return shifts.map((shift) => ({
      ...shift,
      id: shift._id!.toString(),
    }));
  }

  async getByShiftId(shiftId: string): Promise<IShift | null> {
    const doc = await this.collection.findOne<IShift>({
      shiftId,
      removedAt: { $exists: false },
    });
    if (!doc) {
      return null;
    }
    return {
      ...doc,
      id: doc._id!.toString(),
    };
  }

  async getTotalEmptyShiftsPostLottery({
    counter,
    orgId,
  }: {
    orgId: string;
    counter: number;
  }) {
    const pipeline = [
      {
        $match: {
          lotteryNumber: counter,
          orgId: new ObjectId(orgId),
          removedAt: { $exists: false },
        },
      },
      {
        $lookup: {
          from: "shifts",
          localField: "_id",
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
          count: { $count: { } }
        },
      },
    ];

    const res = await this.eventsCollection.aggregate<{
      _id: string;
      count: number;
    }>(pipeline).toArray();

    return res.reduce((sum, item) => sum + item.count, 0);
  }

  async findOpenInterestListShiftsGroupedById({
    orgId,
  }: {
    orgId: string;
  }) {
    const orgIdObj = new ObjectId(orgId);

    const pipeline = [
      {
        $match: {
          status: EventStatus.InterestList,
          autoAssignInterestList: true,
          orgId: orgIdObj,
          removedAt: { $exists: false },
        },
      },
      {
        $lookup: {
          from: "shifts",
          localField: "_id",
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
        },
      },
    ];

    const res = await this.eventsCollection.aggregate<{
      _id: string;
    }>(pipeline).toArray();

    return {
      items: res,
    };
  }

  async findOpenLotteryShiftsGroupedById({
    orgId,
  }: {
    orgId: string;
  }) {
    const orgIdObj = new ObjectId(orgId);
    const { counter } = await this.lotteryCounter.get(orgIdObj);

    const pipeline = [
      {
        $match: {
          status: EventStatus.ReadyForLottery,
          orgId: orgIdObj,
          lotteryNumber: counter,
          removedAt: { $exists: false },
        },
      },
      {
        $lookup: {
          from: "shifts",
          localField: "_id",
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
        },
      },
    ];

    const res = await this.eventsCollection.aggregate<{
      _id: string;
    }>(pipeline).toArray();

    const orderedIds = await this.lottoShiftRequestCollection.aggregate<{
      _id: string;
    }>([
      {
        $match: {
          lotteryCounter: counter,
          orgId: new ObjectId(orgId),
          shiftGroupId: {
            $in: res.map(({ _id }) => _id),
          },
          removedAt: { $exists: false },
        }
      },
      {
        $group: {
          _id: "$shiftGroupId",
          count: {
            $count: {},
          },
        }
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ]).toArray();

    return {
      items: orderedIds,
      lotteryCounter: counter,
    };
  }

  async findAllUnassignedShiftsByGroupId({
    shiftGroupId,
    includeLockedShifts,
  }: {
    shiftGroupId: string;
    includeLockedShifts?: boolean;
  }) {
    const res = await this.collection.find<IShift>({
      $and: [
        { shiftId: shiftGroupId },
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
        ...(includeLockedShifts ? [] : [
          {
            $or: [
              { locked: false },
              {
                locked: {
                  $exists: false,
                },
              },
            ],
          }
        ]),
      ],
    }).toArray();
    return res.map(({_id, ...item}) => ({
      ...item,
      _id,
      id: _id!.toString(),
    }) as IShift);
  }

  async dynamicSearch(input: ShiftSearchExtended): Promise<SearchResults<IShift>> {
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

    logger.info('Dynamic shift keys', { keys: Object.keys(matchInput).map((key) => ({ keyType: typeof key, key })) });

    if (createdById) {
      (matchInput as any).createdById = { $in: createdById.map((cbi) => new ObjectId(cbi!)) };
    }

    if (eventIds) {
      (matchInput as any).eventId = { $in: eventIds.map((eventId) => new ObjectId(eventId!)) };
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
    if (userIsAdmin(requestingUser)) {
      if (assignedIds) {
        (matchInput as any).userId = { $in: assignedIds.map((uId) => new ObjectId(uId!)) };  
      } else if (userId) {
        (matchInput as any).userId = new ObjectId(userId!);
      }
    } else {
      (matchInput as any).userId = requestingUser?._id;
    }

    if (range) {
      const { startTime, endTime, removedAt } = range;
      if (startTime && startTime.value) {
        (matchInput as any).startTime = new Date(startTime.value);
      } else if (startTime && (startTime.gte || startTime?.lte)) {
        (matchInput as any).startTime = {
          ...(startTime.gte ? { $gte: new Date(startTime.gte) } : {}),
          ...(startTime.lte ? { $lte: new Date(startTime.lte) } : {}),
        };
      }

      if (endTime && endTime.value) {
        (matchInput as any).endTime = new Date(endTime.value);
      } else if (endTime && (endTime.gte || endTime?.lte)) {
        (matchInput as any).endTime = {
          ...(endTime.gte ? { $gte: new Date(endTime.gte) } : {}),
          ...(endTime.lte ? { $lte: new Date(endTime.lte) } : {}),
        };
      }

      if (removedAt && removedAt.value) {
        (matchInput as any).removedAt = new Date(removedAt.value);
      } else if (removedAt && (removedAt.gte || removedAt?.lte)) {
        (matchInput as any).removedAt = {
          ...(removedAt.gte ? { $gte: new Date(removedAt.gte) } : {}),
          ...(removedAt.lte ? { $lte: new Date(removedAt.lte) } : {}),
        };
      }
    } else if (startTime || endTime) {
      if (startTime) {
        (matchInput as any).endTime = {
          $gte: new Date(startTime),
        };
      } else if (endTime) {
        (matchInput as any).startTime = {
          $lte: new Date(endTime),
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
        assignmentMatch.$match["assignment.rankIds"] = { $in: rankIds.map((id) => new ObjectId(id!)) };
      }
      if (skillIds) {
        assignmentMatch.$match["assignment.requiredSkillIds"] = { $in: skillIds.map((id) => new ObjectId(id!)) };
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
    });

    const itemResult = await this.collection.aggregate(pipeline).toArray();
    const totalResult = await this.collection.aggregate([
      ...pipeline,
      {
        $count: "total",
      }
    ]).toArray();

    logger.info('Dynamic Shift Result', {
      itemResult,
      totalResult,
    });

    return {
      items: itemResult.map(({_id, ...item}) => ({
        ...item,
        id: _id.toString(),
      })) as IShift[],
      total: totalResult.length > 0 ? totalResult[0].total : 0,
    };
  }

  async generateSlotsFromAssignment(assignmentId: ObjectId) {
    const pipeline = [
      {
        $match: { assignmentId }
      },
      {
        $group: {
          _id: "$shiftId",
          slotCount: { $count: {} }
        }
      }
    ];
    const result = await this.collection.aggregate<{_id: string; slotCount: number; }>(pipeline).toArray();
    return result.map(({ _id, slotCount }) => ({
      id: new ObjectId(),
      slotCount,
    })) as IAssignmentShiftSlots[];
  }

  canRelinquishShift({
    shift,
    organization
  } : {
    shift: IShift;
    organization: IOrganization;
  }) {
    const now = utcToZonedTime(new Date(), organization.timezone);
    const startTime = utcToZonedTime(shift.startTime, organization.timezone);

    const allowedHoursBefore = organization.settings?.userRelinquishShift.numberOfHoursBeforeShift || 0;

    if (isAfter(startTime, addHours(now, allowedHoursBefore))) {
      return false;
    }

    return true;
  }

  findAllByEventId({
    eventId,
  }: {
    eventId: ObjectId;
  }) {
    return this.collection.find<IShift>({
      eventId,
      removedAt: { $exists: false },
    })
    .toArray()
    .then((shifts) => shifts.map((shift) => ({
      ...shift,
      id: shift._id!.toString(),
    })));
  }
};
