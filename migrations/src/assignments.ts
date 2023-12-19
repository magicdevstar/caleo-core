import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { Collection, Db, ObjectId } from "mongodb";
import { mysql } from "./utils/mysql";
import { Assignment, DocType, MemberRole } from "./utils/resolvers-types";
import { NotificationType, ShiftNotificationAction, ShiftUpsertNotification } from "../../backend/core/src/types/notifications";

const lambda = new LambdaClient({ region: 'us-west-2' });

export interface OldAssignment {
  id: number
  name: string
  event_id: number
  created_at: Date
  created_by: number
  modified_at: Date
  modified_by: number
  note: string
  bw_needed: number
  removed_at: any
  notify_on_assignment: number
}

interface MongoAssignment extends Omit<Assignment, 'id' | 'event' | 'org'> {
  migrationId: number
}

export const scheduleShiftReminders = async (collection: Collection, db: Db) => {
  for await (const shift of collection.find({
    startTime: { $gte: Date.now() },
    userId: { $ne:null },
    $or: [
      {removedAt: { $exists: false }},
      {removedAt: null }
    ]
  })) {
    try {
      const out = await lambda.send(new InvokeCommand({
        FunctionName: 'caleo-core-prod-shiftNotificationScheduler',
        InvocationType: 'Event',
        Payload: JSON.stringify({
          type: NotificationType.Shift,
          action: ShiftNotificationAction.UpsertNotification,
          id: shift._id.toString(),
        } as ShiftUpsertNotification),
      }));
      console.log(out);
      await (async () => new Promise((resolve) => setTimeout(resolve, 500)))();
    } catch(error) {
      console.log(error);
    }
  }
}

export const assignments = async (collection: Collection, db: Db) => {
  try {
    const bulk: any = [];
    const migrationIds = (await collection
      .find({ migrationId: { $exists: true } })
      .project({ migrationId: 1 })
      .toArray())
      .map(({ migrationId }) => migrationId);

    const skillsMap = (await db
      .collection('skills')
      .find({ })
      .project({ migrationId: 1, _id: 1 })
      .toArray()).reduce((acc, { migrationId, _id }) => {
        acc[migrationId] = _id.toString();
        return acc;
      }, {});

    const rankMap = (await db
      .collection('ranks')
      .find({ })
      .project({ migrationId: 1, _id: 1 })
      .toArray()).reduce((acc, { migrationId, _id }) => {
        acc[migrationId] = _id.toString();
        return acc;
      }, {});

    const adminMap = (await db
      .collection('users')
      .find({ 'member.role': MemberRole.Admin })
      .project({ migrationId: 1, _id: 1 })
      .toArray()).reduce((acc, { migrationId, _id }) => {
        acc[migrationId] = _id.toString();
        return acc;
      }, {});

    const eventMap = (await db
      .collection('events')
      .find({})
      .project({ migrationId: 1, _id: 1 })
      .toArray()).reduce((acc, { migrationId, _id }) => {
        acc[migrationId] = _id.toString();
        return acc;
      }, {});
    
    for await (const assignment of mysql<OldAssignment>('assignment').stream()) {
      const foundMongo = migrationIds.includes(assignment.id);
      if (!foundMongo && eventMap[assignment.event_id]) {
        const skillIds = (await mysql<{ skill_id: number, assignment_id: number }>('assignment_skill')
          .where({ assignment_id: assignment.id })
          .select('skill_id'))
          .filter(({ skill_id }) => skillsMap[skill_id])
          .map(({ skill_id }) => skillsMap[skill_id]);
        const rankIds = (await mysql<{ rank_id: number, assignment_id: number }>('assignment_rank')
          .where({ assignment_id: assignment.id })
          .select('rank_id'))
          .filter(({ rank_id }) => rankMap[rank_id])
          .map(({ rank_id }) => rankMap[rank_id]);

        const item: MongoAssignment = {
          name: assignment.name,
          migrationId: assignment.id,
          description: assignment.note,
          eventId: eventMap[assignment.event_id],
          orgId: process.env.ORG_ID!,
          notifyWhenFullyStaffed: assignment.notify_on_assignment === 1,
          docType: DocType.Assignment,
          requiredSkillIds: skillIds,
          rankIds: rankIds,
          bwNeeded: !!assignment.bw_needed,
          // Fill these in during the shift migration
          shiftIds: [],
          createdAt: assignment.created_at.getTime() as any,
          updatedAt: assignment.modified_at.getTime() as any,
          ...(assignment.removed_at && { removedAt: assignment.removed_at.getTime() as any }),
          ...(adminMap[assignment.modified_by] && {modifiedBy: adminMap[assignment.modified_by]}),
        };
        bulk.push(item);
      }
    }
    if (bulk.length > 0) {
      const res = await collection.insertMany(bulk);
      console.log('Events bulk write: ', JSON.stringify(res, null, 2));

      const eventUpdates: any = {};
      Object.keys(res.insertedIds).forEach((index) => {
        const assignmentId = res.insertedIds[index as any];
        const { eventId, removedAt } = bulk[index];
        if (!removedAt) {
          if (!eventUpdates[eventId]) {
            eventUpdates[eventId] = [];
          }
          eventUpdates[eventId].push(assignmentId.toString());
        }
      });

      const eventBulkUpdates: any = Object.keys(eventUpdates).map((eventId) => ({
        updateOne: {
          filter: { _id: new ObjectId(eventId) },
          update: { $push: { assignmentIds: {$each: eventUpdates[eventId]} } },
        },
      }));

      if (eventBulkUpdates.length > 0) {
        const eventRes = await db.collection('events').bulkWrite(eventBulkUpdates);
        console.log('User Member Skills bulk write: ', JSON.stringify(eventRes, null, 2));
      }
    } 
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}