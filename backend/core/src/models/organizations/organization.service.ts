import { format, getDay, parseISO } from "date-fns";
import { randomUUID as uuid } from 'crypto';
import { DayOfWeek, OrganizationSearchInput, OrganizationEventSettingsUpload } from '../../__generated__/resolvers-types';
import { ScheduleEvent } from "../scheduler";
import { toZonedTime } from 'date-fns-tz';
import { dayMap } from '../../utils/dayMap';
import { SchedulerModel } from "../scheduler";
import { OrganizationRepo } from "./organization.repository";
import { ObjectId } from "mongodb";
import { IOrganization } from "./organization.entity";
import DataLoader from "dataloader";
import { SearchResults } from "../../utils/common.resolvers";
import { DocumentModel } from "../document";

export class OrganizationService {
  public loader: DataLoader<string, IOrganization | undefined, string>;

  public defaultEventThumbnailLoader = new DataLoader(async (keys: readonly string[]) => {
    const url = await this.documents.getDownloadUrl(keys[0]);
    return keys.map(() => url);
  });

  constructor(
    private organizationRepo: OrganizationRepo,
    private scheduler: SchedulerModel,
    private documents: DocumentModel,
  ) {
    this.loader = organizationRepo.loader;
  }

  setFeature({
    _id,
    feature,
    value,
  }: {
    _id: ObjectId;
    feature: string;
    value: boolean;
  }) {
    return this.organizationRepo.collection.updateOne({ _id }, {
      $set: {
        [`features.${feature}`]: value,
      }
    });
  }

  get(id: string | ObjectId): Promise<IOrganization | null> {
    return this.organizationRepo.get(id);
  }

  update(org: any) {
    return this.organizationRepo.update(org);
  }

  async getOrganizationSSOConfig(subdomain: string): Promise<IOrganization | null> {
    return this.organizationRepo.getOrganizationSSOConfig(subdomain);
  }

  async getBySSOAppName(uiSubDomains: string): Promise<IOrganization | null> {
    return this.organizationRepo.getBySSOAppName(uiSubDomains);
  }

  async create(org: any): Promise<any> {
    return this.organizationRepo.create(org);
  }

  withCheckoutEnabled(): Promise<IOrganization[]> {
    return this.organizationRepo.collection.find<IOrganization>({
      'features.eventCheckIn': true,
    }).toArray();
  }

  async getDefaultEventThumbnailUploadUrl(orgId: string): Promise<OrganizationEventSettingsUpload> {
    const imagePath = `${orgId}/eventThumbnails/${uuid()}`;
    const uploadUrl = await this.documents.getUploadUrl(imagePath);
    return {
      imagePath,
      uploadUrl,
    };
  }

  getDefaultEventThumbnail(path: string): Promise<string | null> {
    return this.documents.getDownloadUrl(path);
  }

  async search(input: OrganizationSearchInput): Promise<SearchResults<IOrganization>> {
    return this.organizationRepo.search({
      limit: input.limit,
      skip: input.skip,
      queryField: input.queryField || 'name',
      order: input.order,
      orderBy: input.orderBy,
      query: input.query,
      ...(input.excludeIds && { _id: { $nin: input.excludeIds.map((id: any) => new ObjectId(id)) } }),
    });
  }

  async all(): Promise<IOrganization[]> {
    return this.organizationRepo.collection.find<IOrganization>({}).toArray();
  }

  async scheduleLotteryEvents(orgId: ObjectId, org: IOrganization) {
    if (!org?.features?.lottery) {
      return;
    }
    const startTime = toZonedTime(new Date(org.settings?.lottery?.open?.time || 0), org?.timezone || 'America/Los_Angeles' as any);
    const startDay = org.settings?.lottery?.open?.dayOfWeek || DayOfWeek.Friday;
    const endTime = toZonedTime(new Date(org.settings?.lottery?.close?.time || 0), org?.timezone || 'America/Los_Angeles' as any);
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
  
    const now = toZonedTime(new Date(), timezone);
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

    const openTimeStr = toZonedTime(new Date(open.time), timezone).toISOString();
    const closeTimeStr = toZonedTime(new Date(close.time), timezone).toISOString();
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