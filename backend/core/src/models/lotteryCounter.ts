import { BaseModel } from "./base";
import { DocType, LotteryCounter } from "../__generated__/resolvers-types";

export class LotteryCounterModel extends BaseModel<LotteryCounter> {
  public id = 'lotteryCounter';

  constructor(db) {
    super(db, DocType.LotteryCounter, 'lotteryCounter');
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

  async increment(orgId: string): Promise<LotteryCounter> {
    const counter = await this.get(orgId);
    counter.counter++;
    await this.update(counter, { skipMerge: true });
    return counter;
  }
}