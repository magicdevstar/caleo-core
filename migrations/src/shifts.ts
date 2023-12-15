import { Collection, Db, ObjectId } from "mongodb";
import { v4 as uuid } from 'uuid';
import { utcToZonedTime } from 'date-fns-tz';
import { endOfDay, getDay, getHours, getMinutes, setHours, setMinutes } from 'date-fns';
import { mysql } from "./utils/mysql";
import { DocType, Shift, ShiftStatus } from "./utils/resolvers-types";

const dayOfWeek = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday', // [6]
];

const query = `select
	s.id as id,
	e.id as eventId,
	a.id as assignmentId,
	s.created_at as createdAt,
	s.modified_at as modifiedAt,
	s.removed_at as removedAt,
	s.shift_start as shiftStart,
	s.shift_end as shiftEnd,
	su.user_id as userId,
	su.removed_at as userRemovedAt,
	su.relinquished_at as userRelinquishedAt,
	su.reason as userRelinquishReason,
	su.reference_number as shiftRefNumber,
  su.is_locked as isLocked
from shift as s
	join shift_user as su on su.shift_id = s.id
	join \`assignment\` as a on a.id = s.assignment_id
	join \`event\` as e on e.id = a.event_id
where su.pending_reason IS NULL`;

export interface OldShift {
  id: number
  eventId: number
  assignmentId: number
  createdAt: Date
  modifiedAt: Date
  removedAt: Date
  userRemovedAt: Date
  userRelinquishedAt: Date
  shiftStart: string
  shiftEnd: string
  userId: number
  isLocked: number
  userRelinquishReason: string
  shiftRefNumber: number
}


interface MongoShift extends Omit<Shift, 'id' | 'event' | 'org' | 'assignment'> {
  migrationId: number
}

const createAvailability = (shift: Shift, timezone: string) => {
  const startTime = utcToZonedTime(new Date(shift.startTime), timezone);
  const endTime = utcToZonedTime(new Date(shift.endTime), timezone);

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
};

export const shifts = async (collection: Collection, db: Db): Promise<Record<string, {startTime: number; endTime: number;}>> => {
  const eventTimeMap: Record<string, {startTime: number; endTime: number;}> = {};
  try {
    const bulk: any = [];
    const migrationIds = (await collection
      .find({ migrationId: { $exists: true } })
      .project({ migrationId: 1 })
      .toArray())
      .map(({ migrationId }) => migrationId);

    const eventMap = (await db
      .collection('events')
      .find({})
      .project({ migrationId: 1, _id: 1 })
      .toArray()).reduce((acc, { migrationId, _id }) => {
        acc[migrationId] = _id.toString();
        return acc;
      }, {});

    const assignmentMap = (await db
      .collection('assignments')
      .find({})
      .project({ migrationId: 1, _id: 1 })
      .toArray()).reduce((acc, { migrationId, _id }) => {
        acc[migrationId] = _id.toString();
        return acc;
      }, {});

    const userMap = (await db
      .collection('users')
      .find({})
      .project({ migrationId: 1, _id: 1 })
      .toArray()).reduce((acc, { migrationId, _id }) => {
        acc[migrationId] = _id.toString();
        return acc;
      }, {});
    const organization = await db.collection('organizations').findOne({
      _id: new ObjectId(process.env.ORG_ID!),
    });

    const idMap: any = {};

    for await (const shift of mysql.raw<any>(query).stream()) {
      const foundMongo = migrationIds.includes(shift.id);
      if (!foundMongo) {
        let uid = idMap[shift.id]
        if (!uid) {
          uid = uuid();
          idMap[shift.id] = uid;
        }

        const eventId = eventMap[shift.eventId];

        if (!eventTimeMap[eventId]) {
          eventTimeMap[eventId] = {
            startTime: shift.shiftStart.getTime(),
            endTime: shift.shiftEnd.getTime(),
          };
        }
        if (eventTimeMap[eventId].startTime > shift.shiftStart.getTime()) {
          eventTimeMap[eventId].startTime = shift.shiftStart.getTime();
        }
        if (eventTimeMap[eventId].endTime < shift.shiftEnd.getTime()) {
          eventTimeMap[eventId].endTime = shift.shiftEnd.getTime();
        }
        
        let status: ShiftStatus = ShiftStatus.Available;
        if (shift.isLocked === 1) {
          status = ShiftStatus.Locked;
        } else if (shift.userRelinquishedAt) {
          status = ShiftStatus.Relinquished;
        } else if (shift.userRemovedAt) {
          status = ShiftStatus.Unassigned;
        } else if (shift.removedAt) {
          status = ShiftStatus.Removed;
        } else if (shift.userId) {
          status = ShiftStatus.Assigned;
        }

        let removedAt;
        if (shift.userRelinquishedAt) {
          removedAt = shift.userRelinquishedAt.getTime();
        } else if (shift.userRemovedAt) {
          removedAt = shift.userRemovedAt.getTime();
        } else if (shift.removedAt) {
          removedAt = shift.removedAt.getTime();
        }

        const item: MongoShift = {
          migrationId: shift.id,
          shiftId: uid,
          refNumber: shift.shiftRefNumber,
          startTime: shift.shiftStart.getTime(),
          endTime: shift.shiftEnd.getTime(),
          status,
          docType: DocType.Shift,
          orgId: process.env.ORG_ID!,
          locked: status === ShiftStatus.Locked,
          relinquishNote: shift.userRelinquishReason,
          eventId,
          assignmentId: assignmentMap[shift.assignmentId],
          userId: userMap[shift.userId],
          createdById: userMap[shift.userId],
          createdAt: shift.createdAt.getTime(),
          updatedAt: shift.modifiedAt.getTime(),
          ...(removedAt && {removedAt}),
        };
        const availability = createAvailability(item as any, organization?.timezone || 'America/Los_Angeles');
        item.availability = availability;

        bulk.push(item);
      }
    }
    if (bulk.length > 0) {
      const res = await collection.insertMany(bulk);
      console.log('shifts bulk write: ', JSON.stringify(res, null, 2));

      const assignmentUpdates: any = {};
      Object.keys(res.insertedIds).forEach((index) => {
        const shiftId = res.insertedIds[index as any];
        const { assignmentId, status } = bulk[index];
        if ([ShiftStatus.Assigned, ShiftStatus.Available, ShiftStatus.Locked].includes(status)) {
          if (!assignmentUpdates[assignmentId]) {
            assignmentUpdates[assignmentId] = [];
          }
          assignmentUpdates[assignmentId].push(shiftId.toString());
        }
      });

      const assignmentBulkUpdates: any = Object.keys(assignmentUpdates).map((assignmentId) => ({
        updateOne: {
          filter: { _id: new ObjectId(assignmentId) },
          update: { $push: { shiftIds: {$each: assignmentUpdates[assignmentId]} } },
        },
      }));

      if (assignmentBulkUpdates.length > 0) {
        const assignmentRes = await db.collection('assignments').bulkWrite(assignmentBulkUpdates);
        console.log('Assignment bulk write: ', JSON.stringify(assignmentRes, null, 2));
      }
    } 

  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
  return eventTimeMap;
}