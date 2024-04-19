import { format, getTime, formatDistanceToNow, startOfWeek, endOfWeek } from 'date-fns';

// ----------------------------------------------------------------------

type InputValue = Date | string | number | null | undefined;

export function fDate(date: InputValue, newFormat?: string) {
  const fm = newFormat || 'dd MMM yyyy';

  return date ? format(new Date(date), fm) : '';
}

export function fDateTime(date: InputValue, newFormat?: string) {
  const fm = newFormat || 'dd MMM yyyy p';

  return date ? format(new Date(date), fm) : '';
}

export function fTimestamp(date: InputValue) {
  return date ? getTime(new Date(date)) : '';
}

export function fToNow(date: InputValue) {
  return date
    ? formatDistanceToNow(new Date(date), {
        addSuffix: true,
      })
    : '';
}

export function fWeekRange(date: Date, weekStartsOn?: number) {
  const start = startOfWeek(date, { weekStartsOn: weekStartsOn as any });
  const end = endOfWeek(date, { weekStartsOn: weekStartsOn as any });
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  const startMonth = format(start, 'MMM');
  const startDay = format(start, 'dd');
  const startYear = format(start, 'yyyy');
  const endDay = format(end, 'dd');
  const endMonth = format(end, 'MMM');
  const endYear = format(end, 'yyyy');

  if (sameMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
  }
  if (sameYear) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
  }
  return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
}
