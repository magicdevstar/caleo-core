import {
  SchedulerClient,
  CreateScheduleCommand,
  UpdateScheduleCommand,
  GetScheduleCommand,
  CreateScheduleCommandInput,
  FlexibleTimeWindowMode,
  Target,
  ScheduleState,
  UpdateScheduleCommandInput,
  DeleteScheduleCommand,
  ActionAfterCompletion
} from "@aws-sdk/client-scheduler";
import { readFileSync, writeFileSync } from "fs";
import { format, isBefore } from "date-fns";
import { Collection, Db, ObjectId } from "mongodb";
import { mysql } from "./utils/mysql";
import { DocType, MemberRole, MemberStatus, MemberTier, User } from "./utils/resolvers-types";
import { getUserByEmail } from "./utils/cognito-user-lookup";

const scheduler = new SchedulerClient({ region: 'us-west-2' });

export enum ScheduleEvent {
  LOTTO_START = 'lotto_start',
  LOTTO_END = 'lotto_end',
  LOTTO_NOTIFY = 'lotto_notify',
  SHIFT_REMINDER = 'shift_reminder',
  EVENT_COMPLETE = 'event_complete',
  EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE = 'event_fcfs_live',
  USER_TIER_RETURN = 'user_tier_return',
  USER_INACTIVE_RETURN = 'user_inactive_return',
}

export enum Timezone {
  UTC = 'UTC',
  PST = 'America/Los_Angeles',
  EST = 'America/New_York',
  CST = 'America/Chicago',
  MST = 'America/Denver',
}

export interface OldUser {
  id: number
  username: string
  p_number: number
  email: string
  receive_email: number
  alt_email: any
  alt_receive_email: number
  phone_number: string
  receive_text: number
  alt_receive_text: number
  first_name: string
  last_name: string
  approved: number
  last_password_reset: any
  overtime_limit: number
  retirement_date: any
  deactivate_until_date: any
  is_active: number
  status: string
  status_reason: any
  role: string
  status_last_updated: string
  created_at: string
  rank_id: number
  tier_id: number
  identity_store_id: string
  tier_until: any
  alt_phone_number: any
  note: any
}

const MemberRoleMap = {
  'Admin': MemberRole.Admin,
  'Officer': MemberRole.Member,
};

const MemberStatusMap: Record<string, MemberStatus> = {
  'Active': MemberStatus.Active,
  'Inactive': MemberStatus.Inactive,
  'Pending': MemberStatus.Pending,
  'Deleted': MemberStatus.Removed,
  'Removed': MemberStatus.Removed,
}

const availabilityDayMap: Record<string, string> = {
  'Mon': 'monday',
  'Tue': 'tuesday',
  'Wed': 'wednesday',
  'Thu': 'thursday',
  'Fri': 'friday',
  'Sat': 'saturday',
  'Sun': 'sunday',
}

const getSchedule = async ({
  orgId,
  event,
  customEventName,
}: {
  orgId: string;
  event: ScheduleEvent;
  customEventName?: string;
}) => {
  const command = new GetScheduleCommand({
    Name: customEventName || `${orgId}-${event}`,
  });

  try {
    const res = await scheduler.send(command);
    return res;
  } catch(error) {
    return null;
  }
}

const updateScheduledEvent = async ({
  event,
  orgId,
  eventTime,
  eventTimeZone,
  eventInput,
  customEventName,
  enabled = ScheduleState.ENABLED,
} : {
  event: ScheduleEvent;
  orgId: string;
  customEventName?: string;
  eventTime: string;
  eventTimeZone: Timezone;
  eventInput: any;
  enabled?: ScheduleState;
}) => {
  try {
    const foundSchedule = await getSchedule({
      orgId,
      event,
      customEventName,
    });
    const input: CreateScheduleCommandInput | UpdateScheduleCommandInput = {
      Name: customEventName || `${orgId}-${event}`,
      ScheduleExpression: eventTime,
      FlexibleTimeWindow: {
        Mode: FlexibleTimeWindowMode.FLEXIBLE,
        MaximumWindowInMinutes: 1,
      },
      ActionAfterCompletion: ActionAfterCompletion.DELETE,
      ScheduleExpressionTimezone: eventTimeZone,
      Target: {
        Arn: 'arn:aws:lambda:us-west-2:707495320920:function:caleo-core-prod-scheduledEvents',
        RoleArn: 'arn:aws:iam::707495320920:role/caleo-core-prod-SchedulerRole-LphWrhQMs4M0',
        Input: JSON.stringify(eventInput),
      } as Target,
      State: enabled,
    };

    const command = foundSchedule ? new UpdateScheduleCommand(input) : new CreateScheduleCommand(input);
    const res = await scheduler.send(command);
    return res;
  } catch(error) {
    console.error('Failed to update scheduled event: ', error);
  }
}

export const setTierUntil = async (collection: Collection, db: Db) => {
  const organization = await db.collection('organizations').findOne({ _id: new ObjectId(process.env.ORG_ID!) });
  for await (const user of collection.find({ 'member.tierUntil': { $gte: 0 } })) {
    try {
      const tierReturnDate = new Date(user.member.tierUntil);
      const targetTier = user.member.tier === MemberTier.Tier_2 ? MemberTier.Tier_1 : MemberTier.Tier_2;
      const out = await updateScheduledEvent({
        event: ScheduleEvent.USER_TIER_RETURN,
        orgId: organization!._id.toString(),
        eventTime: `at(${format(tierReturnDate, 'yyyy-MM-dd&&HH:mm:ss').replace('&&','T')})`,
        eventTimeZone: Timezone.UTC,
        customEventName: `${ScheduleEvent.USER_TIER_RETURN}-${user._id.toString()}`,
        eventInput: JSON.stringify({
          action: ScheduleEvent.USER_TIER_RETURN,
          orgId: organization!._id.toString(),
          userId: user._id.toString(),
          tier: targetTier,
        }),
      });
      console.log(out);
      await (async () => new Promise((resolve) => setTimeout(resolve, 500)))();
    } catch(error) {
      console.log(error);
    }
  }
}

export const users = async (collection: Collection, db: Db) => {
  try {
    const bulk: any = [];
    const migrationIds = (await collection
      .find({ migrationId: { $exists: true } })
      .project({ migrationId: 1 })
      .toArray())
      .map(({ migrationId }) => migrationId);

    const ranks = await db
      .collection('ranks')
      .find({})
      .project({ migrationId: 1, _id: 1, name: 1 })
      .toArray();
    const rankIdMap = ranks.reduce((acc, { migrationId, _id }) => {
        acc[migrationId] = _id.toString();
        return acc;
      }, {});
    const officerRank = ranks.find(({ name }) => name === 'Police Officer')?._id.toString();

    for await (const user of mysql<OldUser>('user').stream()) {
      const foundMongo = migrationIds.includes(user.id);

      if (!foundMongo) {
        const legacyOvertimeAvailability = await mysql('overtime_availability').where({ user_id: user.id });

        const unavailableDaysMap = legacyOvertimeAvailability
          .filter(({ day, is_unavailable }) => availabilityDayMap[day] && is_unavailable)
          .reduce((acc, { day }) => ({
            ...acc,
            [availabilityDayMap[day]]: false
          }), {});
        const availableDaysMap = legacyOvertimeAvailability
          .filter(({ day, is_unavailable }) => availabilityDayMap[day] && !is_unavailable)
          .reduce((acc, { day }) => ({
            ...acc,
            [availabilityDayMap[day]]: true
          }), {});
        const availabilityMap = {
          ...unavailableDaysMap,
          ...availableDaysMap,
        };

        const timeBuckets = legacyOvertimeAvailability
          .filter(({ is_unavailable }) => !is_unavailable)
          .reduce((acc, { day, from_time, to_time }) => {
            const realDay = availabilityDayMap[day];
            if (from_time === '24:00') {
              from_time = '23:59';
            }
            if (to_time === '24:00') {
              to_time = '23:59';
            }
            acc[realDay].push({
              startTime: `1970-01-01T${from_time}:00.000Z`,
              endTime: `1970-01-01T${to_time}:00.000Z`,
            });
            return acc;
          }, {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          });

        const item: User = {
          migrationId: user.id,
          cognitoId: user.identity_store_id,
          firstName: user.first_name,
          lastName: user.last_name,
          name: `${user.first_name} ${user.last_name}`,
          imagePath: null,
          superAdmin: false,
          createdAt: user.created_at,
          updatedAt: user.created_at,
          docType: DocType.User,
          member: {
            orgId: process.env.ORG_ID!,
            pNumber: `${user.p_number}`,
            role: (MemberRoleMap as any)[user.role] || MemberRole.Member,
            status: MemberStatusMap[user.status] || MemberStatus.Removed,
            contactInfo: {
              primaryPhone: {
                number: user.phone_number,
                receiveTexts: true,
              },
              primaryEmail: {
                address: user.email,
                receiveEmails: true,
              },
              ...(user.alt_phone_number && {
                secondaryPhone: {
                  number: user.alt_phone_number,
                  receiveTexts: false,
                }
              }),
              ...(user.alt_email && {
                secondaryEmail: {
                  address: user.alt_email,
                  receiveEmails: false,
                },
              }),
            },
            tier: user.tier_id === 1 ? MemberTier.Tier_1 : MemberTier.Tier_2,
            tierUntil: user.tier_until && isBefore(new Date(), new Date(user.tier_until)) ? new Date(user.tier_until).getTime() : null,
            tierResetOnNextLottery: false,
            inactivateUntil: user.deactivate_until_date && isBefore(new Date(), new Date(user.deactivate_until_date)) ? new Date(user.deactivate_until_date).getTime() : null,
            inactivationNote: user.status_reason,
            rankId: rankIdMap[user.rank_id] || officerRank,
            memberSkillIds: [],
            adminNote: user.note,
            maxShifts: user.overtime_limit,
            availability: {
              monday: {
                available: !!availabilityMap.monday,
                times: timeBuckets.monday,
              },
              tuesday: {
                available: !!availabilityMap.tuesday,
                times: timeBuckets.tuesday,
              },
              wednesday: {
                available: !!availabilityMap.wednesday,
                times: timeBuckets.wednesday,
              },
              thursday: {
                available: !!availabilityMap.thursday,
                times: timeBuckets.thursday,
              },
              friday: {
                available: !!availabilityMap.friday,
                times: timeBuckets.friday,
              },
              saturday: {
                available: !!availabilityMap.saturday,
                times: timeBuckets.saturday,
              },
              sunday: {
                available: !!availabilityMap.sunday,
                times: timeBuckets.sunday,
              },
            }
          },
        } as unknown as User;

        bulk.push(item);
      }
    }
    if (bulk.length > 0) {
      const res = await collection.insertMany(bulk);
      console.log('User bulk write: ', JSON.stringify(res, null, 2));
      const ids = Object.values(res.insertedIds);
      const updates: any = [];
      const userMap = JSON.parse(readFileSync(`${__dirname}/data/user-map.json`, 'utf8'));
      for await (const user of collection.find({ _id: { $in: ids } })) {
        const email = user.member.contactInfo.primaryEmail.address;
        let expectedId = userMap[email];
        if (!expectedId) {
          const username = await getUserByEmail(email);
          if (!username) {
            continue;
          }
          expectedId = username;
        }
        if (user.cognitoId !== expectedId) {
          updates.push({
            updateOne: {
              filter: { _id: user._id },
              update: { $set: {cognitoId: expectedId} },
            },
          });
          userMap[email] = expectedId;
        }
      }
      await collection.bulkWrite(updates);
      writeFileSync(`${__dirname}/data/user-map.json`, JSON.stringify(userMap, null, 2));
    }
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}