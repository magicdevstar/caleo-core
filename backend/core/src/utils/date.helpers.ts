import { utcToZonedTime } from "date-fns-tz";
import {
  setMilliseconds,
  setSeconds,
  addHours,
  differenceInMinutes,
  roundToNearestMinutes,
  subHours,
  subMinutes
} from "date-fns";
import { Timezone } from "../models/scheduler";
import logger from "./logger";

export const truncateToMinute = (date: string | Date): Date => {
  return setMilliseconds(setSeconds(new Date(date), 0), 0);
}

export const docusignDates = ({
  startTime,
  endTime,
  timezone,
  startEquipmentTime = 0,
  endEquipmentTime = 0,
} : {
  startTime: Date;
  endTime: Date;
  timezone: Timezone;
  startEquipmentTime?: number;
  endEquipmentTime?: number;
}) => {
  logger.info('Dousign Dates', {
    input: {
      startTime,
      endTime,
      timezone,
      startEquipmentTime,
      endEquipmentTime,
    }
  });
  // The 1 extra hour is for drive time if no equipment time is set
  const additionalEndTime = endEquipmentTime > 0 ? endEquipmentTime : 1;
  const zoneStartTime = roundToNearestMinutes(
    subHours(utcToZonedTime(startTime, timezone), startEquipmentTime),
    {
      nearestTo: 15,
      roundingMethod: 'floor',
    }
  );
  const zoneEndTime = roundToNearestMinutes(
    addHours(utcToZonedTime(endTime, timezone), additionalEndTime),
    {
      nearestTo: 15,
      roundingMethod: 'ceil',
    }
  );

  const diff = differenceInMinutes(zoneEndTime, zoneStartTime, { roundingMethod: 'ceil' });
  const formattedDiff = `${Math.floor(diff / 60)}:${diff % 60}`;
  
  return {
    startTime: zoneStartTime,
    endTime: zoneEndTime,
    formattedDiff,
  };
};
