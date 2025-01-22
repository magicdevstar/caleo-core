import { Collection, Db } from "mongodb";
import { mysql } from "./utils/mysql";
import { ShiftLotteryRequest, ShiftLotteryRequestStatus } from "./utils/resolvers-types";


const eightHours = 8 * 60 * 60 * 1000;
const query = `select
  sr.*,
  e.id as eventId,
  a.id as assignmentId
from shift as s
  join shift_request as sr on sr.shift_id = s.id
  join \`assignment\` as a on a.id = s.assignment_id
  join \`event\` as e on e.id = a.event_id`;

export interface OldShiftRequest {
  id: number
  shift_id: number
  user_id: number
  status: string
  ranking_order: number
  created_at: Date
  created_by: number
  modified_at: Date
  modified_by: number
  is_won: number
  removed_at: Date
  eventId: number
  assignmentId: number
}

const statusMap: Record<string, ShiftLotteryRequestStatus> = {
  'pending': ShiftLotteryRequestStatus.Pending,
  'approved': ShiftLotteryRequestStatus.Approved,
  'denied': ShiftLotteryRequestStatus.Rejected,
}

interface MongoShiftLotteryRequest extends Omit<ShiftLotteryRequest, 'id' | 'event' | 'assignment' | 'org'> {
  migrationId: number
}

export const shiftRequest = async (collection: Collection, db: Db) => {
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

    const shiftMap = (await db
      .collection('shifts')
      .find({})
      .project({ migrationId: 1, _id: 1, shiftId: 1 })
      .toArray()).reduce((acc, { migrationId, shiftId }) => {
        acc[migrationId] = shiftId;
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
    
    for await (const rawSR of mysql.raw<any>(query).stream()) {
      const shiftRequest = rawSR as OldShiftRequest;
      const foundMongo = migrationIds.includes(shiftRequest.id);
      if (!foundMongo) {

        const shiftId = shiftMap[shiftRequest.shift_id];
        const eventId = eventMap[shiftRequest.eventId];
        const assignmentId = assignmentMap[shiftRequest.assignmentId];
        const userId = userMap[shiftRequest.user_id];

        const counterKey = Object.keys(lotteryCounterMap).find((key) => {
          const [start, end] = key.split('^^^');
          return (shiftRequest.created_at.getTime() + eightHours) >= Number(start) && (shiftRequest.created_at.getTime() - eightHours) <= Number(end);
        }) || '';
        const lotteryCounter = lotteryCounterMap[counterKey];

        if (!(counterKey in lotteryCounterMap)) {
          console.log(`No counter found for ${shiftRequest.id}`);
          continue;
        }

        if (!shiftId || !eventId || !assignmentId || !userId) {
          console.log(`Skipping request ${shiftRequest.id}`);
          continue;
        }

        const item: MongoShiftLotteryRequest = {
          migrationId: shiftRequest.id,
          shiftGroupId: shiftId,
          eventId,
          assignmentId,
          orgId: process.env.ORG_ID!,
          order: shiftRequest.ranking_order,
          userId,
          status: (shiftRequest.removed_at ? ShiftLotteryRequestStatus.Removed : statusMap[shiftRequest.status]) as any,
          lotteryCounter,
          createdAt: shiftRequest.created_at.getTime() as any,
          updatedAt: shiftRequest.modified_at.getTime() as any,
          ...(shiftRequest.removed_at && { removedAt: shiftRequest.removed_at.getTime() as any }),
          modifiedById: userMap[shiftRequest.modified_by] || null,
        };
        bulk.push(item);
      }
    }
    if (bulk.length > 0) {
      const res = await collection.insertMany(bulk);
      console.log('Shift requests write bulk write: ', JSON.stringify(res, null, 2));
    } 
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}