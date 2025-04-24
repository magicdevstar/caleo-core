import { utcToZonedTime } from "date-fns-tz";
import {
  setMilliseconds,
  setSeconds,
  addHours,
  differenceInMinutes,
  roundToNearestMinutes,
  subHours,
  subMinutes,
  differenceInHours
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
  startEquipmentTime,
  endEquipmentTime,
} : {
  startTime: Date;
  endTime: Date;
  timezone: Timezone;
  startEquipmentTime?: Date;
  endEquipmentTime?: Date;
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
  const zonedStartTime = utcToZonedTime(startTime, timezone);
  const zonedEndTime = utcToZonedTime(endTime, timezone);

  let totalEquipmentTime = 0;
  let additionalStartTime = 0;
  if (startEquipmentTime) {
    const zonedStartEquipmentTime = utcToZonedTime(startEquipmentTime, timezone);
    additionalStartTime = differenceInHours(zonedStartTime, zonedStartEquipmentTime, { roundingMethod: 'ceil' });
    // Ensure no negative time
    if (additionalStartTime < 0) {
      additionalStartTime = 0;
    }
    totalEquipmentTime += additionalStartTime;
  }

  // The 1 extra hour is for drive time if no equipment time is set
  let additionalEndTime = 1;
  if (endEquipmentTime) {
    const zonedEndEquipmentTime = utcToZonedTime(endEquipmentTime, timezone);
    additionalEndTime = differenceInHours(zonedEndEquipmentTime, zonedEndTime, { roundingMethod: 'ceil' });
    totalEquipmentTime += additionalEndTime;
    // Ensure at least 1 hour for drive time
    if (additionalEndTime < 1) {
      additionalEndTime = 1;
    }
  }

  const zoneStartTime = roundToNearestMinutes(
    subHours(utcToZonedTime(startTime, timezone), additionalStartTime),
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
  const formattedDiffHours = Math.floor(diff / 60).toString().padStart(2, '0');
  const formattedDiffMinutes = (diff % 60).toString().padStart(2, '0');
  const formattedDiff = `${formattedDiffHours}:${formattedDiffMinutes}`;
  
  return {
    startTime: zoneStartTime,
    endTime: zoneEndTime,
    formattedDiff,
    totalEquipmentTime,
  };
};
