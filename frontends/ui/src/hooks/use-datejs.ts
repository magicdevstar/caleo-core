import { useMemo } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useAuthContext } from 'src/auth/hooks';
import { Organization } from 'src/__generated__/resolvers-types';
import {
  roundToNearestMinutes,
  setMilliseconds,
  setSeconds,
  differenceInMinutes,
} from 'date-fns';
import utcToZonedTime from 'date-fns-tz/utcToZonedTime';

dayjs.extend(utc);
dayjs.extend(timezone);

const dateTimeFormat = 'ddd DD MMM YYYY HH:mm';
const dateFormat = 'ddd DD MMM YYYY';
const miniDateFormat = 'MM/DD/YYYY'
const timeFormat = 'HH:mm';

const truncateToMinute = (date: string | Date): Date => {
  return setMilliseconds(setSeconds(new Date(date), 0), 0);
}

// Recrating what is happening on the backend for now
export const convertStartAndEndDate = ({
  startDate,
  endDate,
  user,
}: {
  startDate: Date | string;
  endDate: Date | string;
  user: any;
}) => {
  const tz = user?.member?.org?.timezone || 'UTC';
  const zonedStartTime = roundToNearestMinutes(
    truncateToMinute(utcToZonedTime(startDate, tz)),
    {
      nearestTo: 15,
      roundingMethod: 'floor',
    }
  );
  const zonedEndTime = roundToNearestMinutes(
    truncateToMinute(utcToZonedTime(endDate, tz)),
    {
      nearestTo: 15,
      roundingMethod: 'ceil',
    }
  );
  const diff = differenceInMinutes(zonedEndTime, zonedStartTime, { roundingMethod: 'ceil' });
  const formattedDiff = Number((diff / 60).toFixed(2));

  return {
    startDate: zonedStartTime,
    endDate: zonedEndTime,
    formattedDiff,
  };
};

export const useDateFormats = () => {
  const { user } = useAuthContext();

  return {
    dateTimeFormat: user?.member?.org?.customizations?.dateFormats?.dateTime || dateTimeFormat,
    dateFormat: user?.member?.org?.customizations?.dateFormats?.date || dateFormat,
    miniDateFormat: user?.member?.org?.customizations?.dateFormats?.miniDate || miniDateFormat,
    timeFormat: user?.member?.org?.customizations?.dateFormats?.time || timeFormat,
  };
};

export const getNow = ({
  organization,
}: {
  organization: Organization;
}) => dayjs().tz(organization.timezone);

export const convertDate = ({
  date,
  user,
}: {
  date: Date | string;
  user: any;
}) => dayjs(date).tz(user?.member?.org?.timezone);

export const useDateJS = ({
  date
}: {
  date: Date | string
}) => {
  const { user } = useAuthContext();

  const finalDate = useMemo(() =>
    convertDate({ date, user }),
  [
    date,
    user
  ]);

  return {
    date: finalDate,
  };
}
