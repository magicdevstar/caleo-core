import { useMemo } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useAuthContext } from 'src/auth/hooks';
import { Organization } from 'src/__generated__/resolvers-types';

dayjs.extend(utc);
dayjs.extend(timezone);

export const dateTimeFormat = 'ddd DD MMM YYYY HH:mm';
export const dateFormat = 'ddd DD MMM YYYY';
export const miniDateFormat = 'MM/DD/YYYY'
export const timeFormat = 'HH:mm';

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
