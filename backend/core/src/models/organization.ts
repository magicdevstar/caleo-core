import { Db, ObjectId } from 'mongodb';
import { format, getDay, setHours, parseISO } from "date-fns";
import { DocType, UpsertOrganization, Organization, DayOfWeek, MemberTier, ShiftReminderUnit } from '../__generated__/resolvers-types';
import logger from '../utils/logger';
import { ScheduleEvent } from "../models/scheduler";
import { SchedulerModel } from './scheduler';
import { utcToZonedTime } from 'date-fns-tz';
import { dayMap } from '../utils/dayMap';
import { BaseMongo } from './base.v2';

// Default org properties in function form to deep clone object
export const getDefaultOrg = () => ({
  weekBegins: 'SUNDAY',
  timezone: 'America/Los_Angeles',
});
export const getDefaultOrgSettings = () => ({
  shiftsPerWeek: 6,
  hoursPerMonth: 100,
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
  sso: false,
  equipment: false,
});

export interface IOrganization extends Omit<
  Organization,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'orgId' |
  'org' |
  '__typename'
> {
  _id?: ObjectId;
  id: string;
  orgId: ObjectId;
  modifiedById: ObjectId;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export class OrganizationModel extends BaseMongo<IOrganization> {
  constructor(db: Db, private scheduler: SchedulerModel) {
    super(db, DocType.Organization, 'organizations');
  }

  public async getOrganizationSSOConfig(subdomain: string): Promise<IOrganization | null> {
    const org = await this.collection.findOne<IOrganization>({ 'sso.uiSubDomains': subdomain });
    return org;
  }

  public async getBySSOAppName(uiSubDomains: string): Promise<IOrganization | null> {
    const org = await this.collection.findOne<IOrganization>({ 'sso.uiSubDomains': uiSubDomains });
    return org;
  }

  public async create(org: any): Promise<any> {
    const inputOrg = org as UpsertOrganization;
    const now = new Date();
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

  async scheduleLotteryEvents(orgId: ObjectId, org: IOrganization) {
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

  activeLottery(org: IOrganization) {
    const { timezone, settings: { lottery: { open, close } } } = org as any;
  
    const now = utcToZonedTime(new Date(), timezone);
    const currentDay = format(now, 'EEEE').toUpperCase();
    const currentTime = format(now, 'HH:mm:ss');

    // This accounts for daylight savings by appending
    // the hours:min:seconds to the current date.
    // If we used 1970-01-02 that is in the first half of the year
    // so the hours will be behind by 1 hour 🙄
    const normalizeSettingTime = (settingTime) => {
      const firstHalf = now.toISOString().split('T')[0];
      const secondHalf = settingTime.split('T')[1];
      return `${firstHalf}T${secondHalf}`;
    }

    const openTimeStr = utcToZonedTime(new Date(open.time), timezone).toISOString();
    const closeTimeStr = utcToZonedTime(new Date(close.time), timezone).toISOString();
    const normalOpenTime = normalizeSettingTime(openTimeStr);
    const normalCloseTime = normalizeSettingTime(closeTimeStr);
    const openTime = format(parseISO(normalOpenTime), 'HH:mm:ss');
    const closeTime = format(parseISO(normalCloseTime), 'HH:mm:ss');

    const getDayIndex = (day) => {
      const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      return daysOfWeek.indexOf(day.toUpperCase());
    };
    
    const openDayIndex = getDayIndex(open.dayOfWeek);
    const closeDayIndex = getDayIndex(close.dayOfWeek);
    const currentDayIndex = getDay(now);
    
    // Check if current day is the same as the open or close day and within the time range
    if (currentDay === open.dayOfWeek && currentTime >= openTime) {
      return true;
    }
    if (currentDay === close.dayOfWeek && currentTime <= closeTime) {
      return true;
    }

    // Check if current day is between open and close days
    if (openDayIndex < closeDayIndex) {
      // Normal case: open day is before close day in the same week
      if (currentDayIndex > openDayIndex && currentDayIndex < closeDayIndex) {
        return true;
      }
    } else {
      // Wrapping case: open day is after close day in the week
      if (currentDayIndex > openDayIndex || currentDayIndex < closeDayIndex) {
        return true;
      }
    }
    
    return false;
  }
}