import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import { DayOfWeek, DocType } from "../__generated__/resolvers-types";
import { IOrganization, OrganizationModel } from "./organization";
import { dayMap } from "../utils/dayMap";
import { addWeeks, isAfter, setDay, setHours, setMinutes, getHours, getMinutes } from "date-fns";
import logger from "../utils/logger";
import DataLoader from "dataloader";
import { ObjectId } from "mongodb";
import { BaseMongo } from "./base.v2";

export interface ILotteryCounter {
  _id?: ObjectId;
  id?: string;
  orgId: ObjectId;
  counter: number;
  docType: string;
  start: Date;
  end: Date;
  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
  modifiedById: ObjectId;
}

export class LotteryCounterModel extends BaseMongo<ILotteryCounter> {
  public id = 'lotteryCounter';

  public countLoader = new DataLoader(async (input: readonly {lotteryNumber: number; orgId: string;}[]) => {
    const keys = input.map(({ lotteryNumber }) => lotteryNumber);
    const uniqueKeys = [...new Set(keys)];
    const res = await this.collection.find({
      counter: { $in: uniqueKeys },
      orgId: new ObjectId(input?.[0]?.orgId),
    }).toArray();
    return input.map(({ lotteryNumber }) =>
      res.find((item: any) => item.counter === lotteryNumber)
    );
  });

  constructor(db, private organizations: OrganizationModel) {
    super(db, DocType.LotteryCounter, 'lotteryCounter');
  }

  async getByCounter(counter: number, orgId: ObjectId): Promise<ILotteryCounter | null> {
    const res = await this.collection.findOne<ILotteryCounter>({ counter, orgId });

    if (!res) {
      return null;
    }

    return {
      ...res,
      id: res?._id?.toString(),
    };
  }

  async get(orgId: ObjectId): Promise<ILotteryCounter> {
    const res = await this.collection.findOne<ILotteryCounter>({ orgId: orgId, removedAt: { $exists: false } });

    if (!res) {
      const dates = await this.getNextLotteryDates(orgId);
      const out = {
        id: orgId.toString(),
        orgId: orgId,
        counter: 0,
        docType: DocType.LotteryCounter,
        start: dates.start,
        end: dates.end,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ILotteryCounter;
      return out;
    }
    return res;
  }

  async getNextLotteryDates(orgId: ObjectId, inputOrg?: IOrganization) {
    let org: IOrganization | undefined | null = inputOrg;
    if (!org) {
      org = await this.organizations.get(orgId);
      if (!org) {
        throw new Error(`Organization ${orgId} not found`);
      }
    }
    const zonedDate = utcToZonedTime(new Date(), org?.timezone || 'America/Los_Angeles' as any);
    const endDay = dayMap[org.settings?.lottery.close.dayOfWeek || DayOfWeek.Sunday] - 1;
    const startDay = dayMap[org.settings?.lottery.open.dayOfWeek || DayOfWeek.Sunday] - 1;
    
    const zonedCloseTime = utcToZonedTime(org.settings?.lottery.close.time || '1970-01-02T06:00:00.000Z', org?.timezone || 'America/Los_Angeles' as any);
    const endHour = getHours(zonedCloseTime) || 0;
    const endMinutes = getMinutes(zonedCloseTime) || 0;
  
    const zonedStartTime = utcToZonedTime(org.settings?.lottery.open.time || '1970-01-02T06:00:00.000Z', org?.timezone || 'America/Los_Angeles' as any);
    const startHour = getHours(zonedStartTime) || 0;
    const startMinutes = getMinutes(zonedStartTime) || 0;

    logger.info('Lottery dates', {
      zonedDate,
      startDay,
      startHour,
      startMinutes,
      org,
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
      start: zonedTimeToUtc(lottoStart, org?.timezone || 'America/Los_Angeles' as any),
      end: zonedTimeToUtc(lottoEnd, org?.timezone || 'America/Los_Angeles' as any),
    };
  }

  async updateLotteryDates(organization: IOrganization) {
    const { start, end } = await this.getNextLotteryDates(organization._id!, organization);
    await this.collection.updateOne({
      orgId: new ObjectId(organization.id),
      removedAt: { $exists: false },
    }, {
      $set: {
        start: start,
        end: end,
      },
    });
  }

  async increment(orgId: ObjectId): Promise<ILotteryCounter> {
    const counter = await this.get(orgId);
    if (!counter) {
      throw new Error(`Counter not found for org ${orgId}`);
    }
    // Create new counter record
    const { id, _id, ...currentCounter } = counter;
    const { end, start } = await this.getNextLotteryDates(orgId);
    const res: ILotteryCounter = this.create<ILotteryCounter>({
      ...currentCounter,
      end: end,
      start: start,
      counter: counter.counter + 1,
    }) as any;
    // Remove old counter record
    await this.remove(_id!);
    return res;
  }
}