import { Db } from 'mongodb';
import { format, setHours } from "date-fns";
import { DocType, UpsertOrganization, Organization, DayOfWeek, MemberTier, ShiftReminderUnit } from '../__generated__/resolvers-types';
import logger from '../utils/logger';
import { BaseModel } from './base';
import { ScheduleEvent } from "../models/scheduler";
import { SchedulerModel } from './scheduler';
import { utcToZonedTime } from 'date-fns-tz';
import { dayMap } from '../utils/dayMap';

// Default org properties in function form to deep clone object
export const getDefaultOrg = () => ({
  weekBegins: 'SUNDAY',
  timezone: 'America/Los_Angeles',
});
export const getDefaultOrgSettings = () => ({
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
});
export const getDefaultOrgFeatures = () => ({
  lottery: false,
  venueContractDates: false,
  eventCheckIn: false,
  interestLists: false,
  monthlyMaxHours: false,
  externalEventRequests: false,
});

export class OrganizationModel extends BaseModel<Organization> {
  constructor(db: Db, private scheduler: SchedulerModel) {
    super(db, DocType.Organization, 'organizations');
  }

  public async create(org: any): Promise<any> {
    const inputOrg = org as UpsertOrganization;
    const now = Date.now();
    const insertDoc = {
      ...inputOrg,
      docType: DocType.Organization,
      createdAt: now,
      updatedAt: now,
    };
    const res = await this.collection.insertOne(insertDoc);
    const organization = {
      id: res.insertedId.toString(),
      ...insertDoc,
      createdAt: insertDoc.createdAt as any,
      updatedAt: insertDoc.updatedAt as any,
    };

    logger.info('Organization created', { res, organization });

    return organization as Organization;
  }

  async scheduleLotteryEvents(orgId: string, org: Organization) {
    const startTime = utcToZonedTime(new Date(org.settings?.lottery?.open?.time || 0), org?.timezone || 'America/Los_Angeles' as any);
    const startDay = org.settings?.lottery?.open?.dayOfWeek || DayOfWeek.Friday;
    const endTime = utcToZonedTime(new Date(org.settings?.lottery?.close?.time || 0), org?.timezone || 'America/Los_Angeles' as any);
    const endDay = org.settings?.lottery?.close?.dayOfWeek || DayOfWeek.Monday;
    // Upsert lottery start and end events
    await this.scheduler.updateScheduledEvent({
      event: ScheduleEvent.LOTTO_START,
      orgId: orgId,
      eventTime: `cron(${format(startTime, 'm')} ${format(startTime, 'H')} ? * ${startDay} *)`,
      eventTimeZone: org?.timezone || 'America/Los_Angeles' as any,
      eventInput: JSON.stringify({
        action: ScheduleEvent.LOTTO_START,
        orgId: orgId,
      }),
    });
    await this.scheduler.updateScheduledEvent({
      event: ScheduleEvent.LOTTO_END,
      orgId: orgId,
      eventTime: `cron(${format(endTime, 'm')} ${format(endTime, 'H')} ? * ${endDay} *)`,
      eventTimeZone: org?.timezone || 'America/Los_Angeles' as any,
      eventInput: JSON.stringify({
        action: ScheduleEvent.LOTTO_END,
        orgId: orgId,
      }),
    });
    const hoursBefore = org.settings?.lottery?.notifyUsersBeforeClose || 24;
    const daysToSubtract = Math.floor(hoursBefore / 24);
    const day = (dayMap[endDay] - daysToSubtract) % 7;
    const remainingHours = hoursBefore % 24;
    const hour = Math.max(0, (parseInt(format(endTime, 'H')) - remainingHours));
    await this.scheduler.updateScheduledEvent({
      event: ScheduleEvent.LOTTO_NOTIFY,
      orgId: orgId,
      eventTime: `cron(${format(endTime, 'm')} ${hour} ? * ${day} *)`,
      eventTimeZone: org?.timezone || 'America/Los_Angeles' as any,
      eventInput: JSON.stringify({
        action: ScheduleEvent.LOTTO_NOTIFY,
        orgId: orgId,
      }),
    });
  }
}