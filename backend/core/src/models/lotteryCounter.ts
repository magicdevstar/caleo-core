import { utcToZonedTime } from "date-fns-tz";
import { BaseModel } from "./base";
import { DayOfWeek, DocType, LotteryCounter, Organization } from "../__generated__/resolvers-types";
import { OrganizationModel } from "./organization";
import { dayMap } from "../utils/dayMap";
import { addWeeks, isAfter, setDay, setHours, setMinutes } from "date-fns";
import logger from "../utils/logger";
import DataLoader from "dataloader";

export class LotteryCounterModel extends BaseModel<LotteryCounter> {
  public id = 'lotteryCounter';

  public countLoader = new DataLoader(async (keys: readonly number[]) => {
    // const ids = keys.map((key) => new ObjectId(key));
    const uniqueKeys = [...new Set(keys)];
    const res = await this.collection.find({
      counter: { $in: uniqueKeys },
    }).toArray();
    return keys.map((key) => res.find((item: any) => item.counter === key));
  });

  constructor(db, private organizations: OrganizationModel) {
    super(db, DocType.LotteryCounter, 'lotteryCounter');
  }

  async getByCounter(counter: number, orgId: string): Promise<LotteryCounter | null> {
    const res = await this.findOne({ counter, orgId });

    if (!res) {
      return null;
    }

    return res;
  }

  async get(orgId: string): Promise<LotteryCounter> {
    const res = await this.findOne({ orgId, removedAt: { $exists: false } });

    if (!res) {
      return {
        id: orgId,
        orgId,
        counter: 0,
        docType: DocType.LotteryCounter,
      } as LotteryCounter;
    }

    return res;
  }

  async getNextLotteryDates(orgId: string, inputOrg?: Organization) {
    let org: Organization | undefined | null = inputOrg;
    if (!org) {
      org = await this.organizations.get(orgId);
      if (!org) {
        throw new Error(`Organization ${orgId} not found`);
      }
    }
    const zonedDate = utcToZonedTime(new Date(), org?.timezone || 'America/Los_Angeles' as any);
    const endDay = dayMap[org.settings?.lottery.close.dayOfWeek || DayOfWeek.Sunday] - 1;
    const startDay = dayMap[org.settings?.lottery.open.dayOfWeek || DayOfWeek.Sunday] - 1;
    const [endHour, endMinutes] = (org.settings?.lottery.close.time || '1970-01-02T06:00:00.000Z').split('T')[1].split(':').map((x) => {
      try {
        const parsed = parseInt(x);
        return parsed;
      } catch(e) {
        return 0;
      }
    });
    const [startHour, startMinutes] = (org.settings?.lottery.open.time || '1970-01-02T06:00:00.000Z').split('T')[1].split(':').map((x) => {
      try {
        const parsed = parseInt(x);
        return parsed;
      } catch(e) {
        return 0;
      }
    });

    let lottoStart = setMinutes(setHours(setDay(zonedDate, startDay), startHour), startMinutes);
    let lottoEnd = setMinutes(setHours(setDay(zonedDate, endDay), endHour), endMinutes);
    if (endDay < startDay) {
      lottoEnd = addWeeks(lottoEnd, 1);
    }

    if (isAfter(zonedDate, lottoEnd)) {
      lottoStart = addWeeks(lottoStart, 1);
      lottoEnd = addWeeks(lottoEnd, 1);
    }
    
    return {
      start: lottoStart,
      end: lottoEnd,
    };
  }

  async increment(orgId: string): Promise<LotteryCounter> {
    const counter = await this.get(orgId);
    if (!counter) {
      throw new Error(`Counter not found for org ${orgId}`);
    }
    // Create new counter record
    const { id, ...currentCounter } = counter;
    const { end, start } = await this.getNextLotteryDates(orgId);
    const res: LotteryCounter = this.create({
      ...currentCounter,
      end: end.getTime(),
      start: start.getTime(),
      counter: counter.counter + 1,
    }) as any;
    // Remove old counter record
    await this.remove(id);
    return res;
  }
}