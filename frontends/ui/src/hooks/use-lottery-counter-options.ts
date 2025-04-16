import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { uniqBy } from "lodash";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { LotteryCounter, Maybe, Organization } from "src/__generated__/resolvers-types";
import { GET_LOTTERY_COUNTER } from "src/api/event";
import { DayMap } from "src/types/day";
import { dateTimeFormat } from "./use-datejs";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface ILotteryCounterOption {
  counter: number;
  date: dayjs.Dayjs;
  time: string;
  endDate: dayjs.Dayjs;
  endTime: string;
}

export const useLotteryCounterOptions = ({
  org,
  dateLimit,
  countValue,
}: {
  org: Organization;
  dateLimit?: string;
  countValue?: Maybe<LotteryCounter>;
}) => {
  const { data } = useQuery(GET_LOTTERY_COUNTER);

  const options: ILotteryCounterOption[] = useMemo(() => {
    if (!org?.settings?.lottery?.enabled && data?.lotteryCounter) {
      return [];
    }

    const openDay = org!.settings!.lottery.open.dayOfWeek.toLowerCase();
    const openTime = dayjs(org!.settings!.lottery.open.time).tz(org!.timezone || 'America/Los_Angeles');

    const closeDay = org!.settings!.lottery.close.dayOfWeek.toLowerCase();
    const closeTime = dayjs(org!.settings!.lottery.close.time).tz(org!.timezone || 'America/Los_Angeles');

    let startOfLottery = dayjs().tz(org!.timezone || 'America/Los_Angeles')
      .day(DayMap[openDay])
      .hour(openTime.hour())
      .minute(openTime.minute())
      .second(0)
      .millisecond(0);
    let closeOfLottery = dayjs().tz(org!.timezone || 'America/Los_Angeles')
      .day(DayMap[closeDay])
      .hour(closeTime.hour())
      .minute(closeTime.minute())
      .second(0)
      .millisecond(0);

    if (data?.lotteryCounter.start) {
      startOfLottery = dayjs(data?.lotteryCounter.start).tz(org!.timezone || 'America/Los_Angeles')
      closeOfLottery = dayjs(data?.lotteryCounter.end).tz(org!.timezone || 'America/Los_Angeles')
    }

    let startNumber = data?.lotteryCounter.counter;

    // Set the lottery start date to the next
    if (dayjs().tz(org!.timezone || 'America/Los_Angeles').isAfter(startOfLottery)) {
      startNumber += 1;
      startOfLottery = startOfLottery.add(1, 'week');
      closeOfLottery = closeOfLottery.add(1, 'week');
    }
    // Off set the end date if the lottery is open across weeks
    if (dayjs().tz(org!.timezone || 'America/Los_Angeles').isAfter(closeOfLottery)) {
      closeOfLottery = closeOfLottery.add(1, 'week');
    }

    // If the lottery was in the past calculate the date it was run
    const opts: any[] = [];
    if (countValue) {
      const oldLotteryStart = dayjs(countValue.start).tz(org!.timezone || 'America/Los_Angeles');
      const oldLotteryEnd = dayjs(countValue.end).tz(org!.timezone || 'America/Los_Angeles');
      opts.push({
        counter: countValue.counter,
        date: oldLotteryStart,
        time: oldLotteryStart.format(dateTimeFormat),
        endDate: oldLotteryEnd,
        endTime: oldLotteryEnd.format(dateTimeFormat),
      });
    }

    const limit = dateLimit && dayjs(dateLimit).tz(org!.timezone || 'America/Los_Angeles');

    const list = new Array(5)
      .fill(0)
      .map((_, i) => ({
        counter: startNumber + i,
        date: startOfLottery.add(i, 'week'),
        time: startOfLottery.add(i, 'week').format(dateTimeFormat),
        endDate: closeOfLottery.add(i, 'week'),
        endTime: closeOfLottery.add(i, 'week').format(dateTimeFormat),
      }))
      .filter(({ date }) => !limit || limit.isAfter(date));

    return uniqBy([...opts, ...list], 'counter');
  }, [data, org, dateLimit, countValue]);

  return {
    options,
  };
};
