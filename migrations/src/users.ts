import { isAfter } from "date-fns";
import { Collection, Db } from "mongodb";
import { mysql } from "./utils/mysql";
import { DocType, MemberRole, MemberStatus, MemberTier, Rank, User } from "./utils/resolvers-types";

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

export const users = async (collection: Collection, db: Db) => {
  try {
    const bulk: any = [];
    const migrationIds = (await collection
      .find({ migrationId: { $exists: true } })
      .project({ migrationId: 1 })
      .toArray())
      .map(({ migrationId }) => migrationId);

    // const skillMap = (await db
    //   .collection('skills')
    //   .find({})
    //   .project({ migrationId: 1, _id: 1 })
    //   .toArray()).reduce((acc, { migrationId, _id }) => {
    //     acc[migrationId] = _id.toString();
    //     return acc;
    //   }, {});
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
        // const qualifications = await mysql('qualification').where({ user_id: user.id });
        // const skillIds = qualifications
        //   .filter(({ skill_id }) => skillMap[skill_id])
        //   .map(({ skill_id }) => skillMap[skill_id]);

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
            const startTime = new Date(`1970-01-01T${from_time}:00.000Z`);
            const endTime = new Date(`1970-01-01T${to_time}:00.000Z`);

            acc[realDay].push({
              startTime,
              endTime,
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
            orgId: '64cd5e262c436093a2b7e680',
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
              secondaryPhone: {
                number: user.alt_phone_number,
                receiveTexts: false,
              },
              secondaryEmail: {
                address: user.alt_email,
                receiveEmails: false,
              },
            },
            tier: user.tier_id === 1 ? MemberTier.Tier_1 : MemberTier.Tier_2,
            tierUntil: user.tier_until && isAfter(new Date(), new Date(user.tier_until)) ? new Date(user.tier_until).getTime() : null,
            tierResetOnNextLottery: false,
            inactivateUntil: user.deactivate_until_date && isAfter(new Date(), new Date(user.deactivate_until_date)) ? new Date(user.deactivate_until_date).getTime() : null,
            inactivationNote: user.status_reason,
            rankId: rankIdMap[user.rank_id] || officerRank,
            memberSkillIds: [],
            adminNote: user.note,
            maxShifts: user.overtime_limit,
            availability: {
              monday: {
                available: availabilityMap.monday,
                times: timeBuckets.monday,
              },
              tuesday: {
                available: availabilityMap.tuesday,
                times: timeBuckets.tuesday,
              },
              wednesday: {
                available: availabilityMap.wednesday,
                times: timeBuckets.wednesday,
              },
              thursday: {
                available: availabilityMap.thursday,
                times: timeBuckets.thursday,
              },
              friday: {
                available: availabilityMap.friday,
                times: timeBuckets.friday,
              },
              saturday: {
                available: availabilityMap.saturday,
                times: timeBuckets.saturday,
              },
              sunday: {
                available: availabilityMap.sunday,
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
    }
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}