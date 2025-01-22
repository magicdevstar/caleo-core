import { setMinutes, setSeconds } from "date-fns";
import { mysql } from "./utils/mysql";
import { DocType, LotteryCounter, Rank } from "./utils/resolvers-types";
import { Collection } from "mongodb";

export interface OldEvent {
  id: number
  name: string
  venue_id: number
  created_at: Date
  created_by: number
  modified_at: Date
  modified_by: number
  note: string
  start_at: Date
  end_at: Date
  lottery_start_at: Date
  lottery_end_at: Date
  fcfs_start_at: Date
  fcfs_end_at: Date
  deleted_at: Date
  deleted_by: any
  reference_number: number
  removed_at: Date
  notify_when_staffed: number
  send_notification_on_fcfs: number
}

interface MongoLotteryCounter extends Omit<LotteryCounter, 'id' | 'org'> {}

export const lotteryCounter = async (collection: Collection) => {
  try {
    // const bulk: any = [];
    const query = mysql<OldEvent>('event')
      .whereNotNull('lottery_start_at')
      .whereNotNull('lottery_end_at');

    const lotteryBuckets: any = {};
    for await (const event of query.stream()) {
      const start = setMinutes(setSeconds(event.lottery_start_at, 0), 0);
      const end = setMinutes(setSeconds(event.lottery_end_at, 0), 0);

      const key = `${start.toISOString()}^^^${end.toISOString()}`;
      if (!lotteryBuckets[key]) {
        lotteryBuckets[key] = 0;
      }
      lotteryBuckets[key] += 1;
    }

    const bulk = Object.keys(lotteryBuckets).reverse().map((key, index) => {
      const [start, end] = key.split('^^^');
      const counter: MongoLotteryCounter = {
        orgId: process.env.ORG_ID!,
        counter: (index + 1) * -1,
        docType: DocType.LotteryCounter,
        end: new Date(end).getTime() as any,
        start: new Date(start).getTime() as any,
        removedAt: new Date(end).getTime() as any,
        createdAt: new Date(start).getTime() as any,
        updatedAt: new Date(end).getTime() as any,
      };
      return counter;
    });

    if (bulk.length > 0) {
      const res = await collection.insertMany(bulk);
      console.log('Lottery Counters bulk write: ', JSON.stringify(res, null, 2));
    } 
  } catch(error) {
    console.error('Failed to migrate venues: ', error);
  }
}