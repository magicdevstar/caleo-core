import { Collection, Db, ObjectId } from "mongodb";
import { mysql } from "./utils/mysql";
import { DocType, Event, EventStatus, MemberRole } from "./utils/resolvers-types";

export interface OldEvent {
  id: number
  name: string
  venue_id: number
  created_at: Date
  created_by: number
  modified_at: Date
  modified_by: number
  note: string
  start_at: Date
  end_at: Date
  lottery_start_at: Date
  lottery_end_at: Date
  fcfs_start_at: Date
  fcfs_end_at: Date
  deleted_at: Date
  deleted_by: any
  reference_number: number
  removed_at: Date
  notify_when_staffed: number
  send_notification_on_fcfs: number
}

interface MongoEvent extends Omit<Event, 'id' | 'org'> {
  migrationId: number
}

export const adjustEventTimes = async (collection: Collection, map: Record<string, {startTime: number; endTime: number;}>) => {
  const eventUpdates: any = [];

  Object.keys(map).forEach((key) => {
    const { startTime, endTime } = map[key];
    eventUpdates.push({
      updateOne: {
        filter: { _id: new ObjectId(key) },
        update: {
          $set: {
            startTime,
            endTime,
          },
        },
      },
    });
  });

  if (eventUpdates.length > 0) {
    const res = await collection.bulkWrite(eventUpdates);
    console.log('Events bulk write: ', JSON.stringify(res, null, 2));
  }
}

export const events = async (collection: Collection, db: Db) => {
  try {
    const bulk: any = [];
    const migrationIds = (await collection
      .find({ migrationId: { $exists: true } })
      .project({ migrationId: 1 })
      .toArray())
      .map(({ migrationId }) => migrationId);

    const adminMap = (await db
      .collection('users')
      .find({ 'member.role': MemberRole.Admin })
      .project({ migrationId: 1, _id: 1 })
      .toArray()).reduce((acc, { migrationId, _id }) => {
        acc[migrationId] = _id.toString();
        return acc;
      }, {});
    const venueMap = (await db
      .collection('venues')
      .find({})
      .project({ migrationId: 1, _id: 1 })
      .toArray()).reduce((acc, { migrationId, _id }) => {
        acc[migrationId] = _id.toString();
        return acc;
      }, {});
    const lotteryCounterMap: any = (await db
      .collection('lotteryCounter')
      .find({})
      .toArray()).reduce((acc, { start, end, counter }) => {
        const key = `${new Date(start).getTime()}^^^${new Date(end).getTime()}`;
        acc[key] = counter;
        return acc;
      }, {} as any);
    
    for await (const event of mysql<OldEvent>('event').stream()) {
      const foundMongo = migrationIds.includes(event.id);
      if (!foundMongo) {
        let lotteryCounterKey = '';
        if (event.lottery_end_at && event.lottery_start_at) {
          lotteryCounterKey = `${event.lottery_start_at.getTime()}^^^${event.lottery_end_at.getTime()}`;
        }

        let status = EventStatus.Draft;
        if (!!event.removed_at) {
          status = EventStatus.Removed;
        } else if (event.end_at && event.fcfs_start_at) {
          status = EventStatus.FirstComeFirstServe;
        } else if (event.end_at && event.lottery_start_at && event.end_at.getTime() > Date.now() && event.lottery_start_at.getTime() > Date.now()) {
          status = EventStatus.ReadyForLottery;
        } else if (event.end_at && event.end_at.getTime() < Date.now()) {
          status = EventStatus.Complete;
        }

        const item: MongoEvent = {
          name: event.name,
          referenceId: `${event.reference_number}`,
          searchAttribute: `${event.reference_number} ${event.name}`,
          notes: event.note,
          orgId: process.env.ORG_ID!,
          status,
          ...(event.fcfs_start_at && {scheduledFirstComeFirstServe: event.fcfs_start_at.getTime() as any}),
          notifyOnFirstComeFirstServe: !!event.send_notification_on_fcfs,
          notifyWhenFullyStaffed: !!event.notify_when_staffed,
          docType: DocType.Event,
          migrationId: event.id,
          ...(lotteryCounterMap[lotteryCounterKey] && {lotteryNumber: lotteryCounterMap[lotteryCounterKey]}),
          venueId: venueMap[event.venue_id] || null,
          createdBy: adminMap[event.created_by] || null,
          createdAt: event.created_at.getTime() as any,
          updatedAt: event.modified_at.getTime() as any,
          ...(event.removed_at && {removedAt: event.removed_at.getTime() as any}),
          modifiedById: adminMap[event.modified_by] || null,
          // Add assignments when we do assignment migrations
          assignmentIds: [],
        };
        bulk.push(item);
      }
    }
    if (bulk.length > 0) {
      const res = await collection.insertMany(bulk);
      console.log('Events bulk write: ', JSON.stringify(res, null, 2));
    } 
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}