import { setMilliseconds, setSeconds } from "date-fns";

export const truncateToMinute = (date: string | Date): Date => {
  return setMilliseconds(setSeconds(new Date(date), 0), 0);
}