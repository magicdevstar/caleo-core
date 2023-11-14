import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Organization } from "src/__generated__/resolvers-types";
import { GET_LOTTERY_COUNTER } from "src/api/event";

dayjs.extend(utc);
dayjs.extend(timezone);

const dayMap: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const useLotteryCounterOptions = ({
  org,
  dateLimit,
}: {
  org: Organization;
  dateLimit?: string;
}) => {
  const { data } = useQuery(GET_LOTTERY_COUNTER);

  const options = useMemo(() => {
    if (!org?.settings?.lottery?.enabled && data?.lotteryCounter) {
      return [];
    }

    const openDay = org!.settings!.lottery.open.dayOfWeek.toLowerCase();
    const openTime = dayjs.utc(org!.settings!.lottery.open.time);

    let startOfLottery = dayjs.utc()
      .day(dayMap[openDay])
      .hour(openTime.hour())
      .minute(openTime.minute())
      .second(0)
      .millisecond(0);
    let startNumber = data?.lotteryCounter.counter;
    if (dayjs.utc().isAfter(startOfLottery)) {
      startNumber += 1;
      startOfLottery = startOfLottery.add(1, 'week');
    }

    const limit = dateLimit && dayjs.utc(dateLimit);

    return new Array(5)
      .fill(0)
      .map((_, i) => ({
        counter: startNumber + i,
        date: startOfLottery.add(i, 'week'),
        time: startOfLottery.add(i, 'week').format('ddd DD MMM YYYY HH:mm'),
      }))
      .filter(({ date }) => !limit || limit.isAfter(date));
  }, [data, org, dateLimit]);

  return {
    options,
  };
};
