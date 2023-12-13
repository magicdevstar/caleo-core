import { format, setHours } from "date-fns";
import { Context } from "../../utils/createContext";
import { UpsertOrganization, Organization, DayOfWeek, MemberTier, ShiftReminderUnit } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { commonResolvers } from "../../utils/common.resolvers";
import { ScheduleEvent } from "../../models/scheduler";
import { dayMap } from "../../utils/dayMap";
import { utcToZonedTime } from "date-fns-tz";

export const organization = {
  Query: {
    organization: async (
      _parent: unknown,
      _args: unknown,
      { organizations, user }: Context
    ): Promise<Organization | null> => organizations.get(user?.member.orgId || ''),
  },
  Mutation: {
    organization: async (
      _parent: unknown,
      { organization: org }: { organization: UpsertOrganization },
      { organizations, scheduler, users, lotteryCounter, user }: Context
    ): Promise<Organization> => {
      adminOnly(user);

      const existingOrg = await organizations.get(user?.member.orgId || '');

      const mergedOrg = {
        ...existingOrg,
        ...org,
        contact: {
          ...existingOrg?.contact,
          ...(org.contact || {}),
        },
        settings: {
          ...existingOrg?.settings,
          ...(org.settings || {}),
        },
      };

      if (!mergedOrg.id && !mergedOrg.settings) {
        mergedOrg.settings = {
          shiftsPerWeek: 6,
          lottery: {
            enabled: true,
            notifyUsersBeforeClose: 24,
            fcfsShiftsDelay: 1,
            open: {
              dayOfWeek: DayOfWeek.Friday,
              time: setHours(new Date(0), 18).getTime() as any,
            },
            close: {
              dayOfWeek: DayOfWeek.Monday,
              time: setHours(new Date(0), 6).getTime() as any,
            }
          },
          shiftBuffer: {
            enabled: false,
            minuteShiftBuffer: 15,
            adminOverrideShiftBuffer: false,
          },
          userRelinquishShift: {
            enabled: true,
            numberOfHoursBeforeShift: 24,
            afterShiftRemove: {
              tier: MemberTier.Tier_2,
              days: 21,
            },
            requireNoteWhenRelinquishing: true,
          },
          shiftReminder: {
            enabled: true,
            time: 24,
            unit: ShiftReminderUnit.Hour,
          },
        }
      };

      const res = await organizations.upsert(mergedOrg as any);

      await users.collection.updateMany({
        'member.orgId': mergedOrg.id,
        'member.maxShifts': { $gt: mergedOrg.settings.shiftsPerWeek },
      }, {
        $set: {
          'member.maxShifts': mergedOrg.settings.shiftsPerWeek,
        },
      });

      await lotteryCounter.updateLotteryDates(res);

      const startTime = utcToZonedTime(new Date(mergedOrg.settings?.lottery?.open?.time || 0), mergedOrg?.timezone || 'America/Los_Angeles' as any);
      const startDay = mergedOrg.settings?.lottery?.open?.dayOfWeek || DayOfWeek.Friday;
      const endTime = utcToZonedTime(new Date(mergedOrg.settings?.lottery?.close?.time || 0), mergedOrg?.timezone || 'America/Los_Angeles' as any);
      const endDay = mergedOrg.settings?.lottery?.close?.dayOfWeek || DayOfWeek.Monday;
      // Upsert lottery start and end events
      await scheduler.updateScheduledEvent({
        event: ScheduleEvent.LOTTO_START,
        orgId: user?.member.orgId!,
        eventTime: `cron(${format(startTime, 'm')} ${format(startTime, 'h')} ? * ${startDay} *)`,
        eventTimeZone: mergedOrg?.timezone || 'America/Los_Angeles' as any,
        eventInput: JSON.stringify({
          action: ScheduleEvent.LOTTO_START,
          orgId: user?.member.orgId!,
        }),
      });
      await scheduler.updateScheduledEvent({
        event: ScheduleEvent.LOTTO_END,
        orgId: user?.member.orgId!,
        eventTime: `cron(${format(endTime, 'm')} ${format(endTime, 'h')} ? * ${endDay} *)`,
        eventTimeZone: mergedOrg?.timezone || 'America/Los_Angeles' as any,
        eventInput: JSON.stringify({
          action: ScheduleEvent.LOTTO_END,
          orgId: user?.member.orgId!,
        }),
      });
      const hoursBefore = mergedOrg.settings?.lottery?.notifyUsersBeforeClose || 24;
      const daysToSubtract = Math.floor(hoursBefore / 24);
      const day = (dayMap[endDay] - daysToSubtract) % 7;
      const remainingHours = hoursBefore % 24;
      const hour = Math.max(0, (parseInt(format(endTime, 'h')) - remainingHours));
      await scheduler.updateScheduledEvent({
        event: ScheduleEvent.LOTTO_NOTIFY,
        orgId: user?.member.orgId!,
        eventTime: `cron(${format(endTime, 'm')} ${hour} ? * ${day} *)`,
        eventTimeZone: mergedOrg?.timezone || 'America/Los_Angeles' as any,
        eventInput: JSON.stringify({
          action: ScheduleEvent.LOTTO_NOTIFY,
          orgId: user?.member.orgId!,
        }),
      });

      return res;
    },
  },
  fields: {
    Organization: {
      ...commonResolvers,
    },
    LotteryDate: {
      time: (parent: any) => new Date(parent.time).toISOString(),
    }
  },
};
