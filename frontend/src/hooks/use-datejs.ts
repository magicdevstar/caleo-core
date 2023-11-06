import { useMemo } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useAuthContext } from 'src/auth/hooks';

dayjs.extend(utc);
dayjs.extend(timezone);


export const useDateJS = ({
  date
}: {
  date: Date | string
}) => {
  const { user } = useAuthContext();

  const finalDate = useMemo(() =>
    dayjs(date).tz(user?.member?.org?.timezone),
  [
    date,
    user?.member?.org?.timezone
  ]);

  return {
    date: finalDate,
  };
}
