import { toZonedTime as utcToZonedTime } from "date-fns-tz";
import {
  setMilliseconds,
  differenceInMilliseconds,
  setSeconds,
  addHours,
  differenceInMinutes,
  roundToNearestMinutes,
  subHours,
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
  includeDriveTime,
} : {
  startTime?: Date;
  endTime?: Date;
  timezone: Timezone;
  startEquipmentTime?: Date;
  endEquipmentTime?: Date;
  includeDriveTime: boolean;
}) => {
  if (!startTime || !endTime) {
    return {
      startTime: null,
      endTime: null,
      formattedDiff: 0,
      totalEquipmentTime: 0,
    };
  }
  logger.info('Dousign Dates', {
    input: {
      startTime,
      endTime,
      timezone,
      startEquipmentTime,
      endEquipmentTime,
      includeDriveTime,
    }
  });
  const zonedStartTime = roundToNearestMinutes(
    truncateToMinute(utcToZonedTime(startTime, timezone)),
    {
      nearestTo: 15,
      roundingMethod: 'floor',
    }
  );
  const zonedEndTime = roundToNearestMinutes(
    truncateToMinute(utcToZonedTime(endTime, timezone)),
    {
      nearestTo: 15,
      roundingMethod: 'ceil',
    }
  );

  let totalEquipmentTime = 0;
  let additionalStartTime = 0;
  if (startEquipmentTime) {
    const zonedStartEquipmentTime = roundToNearestMinutes(
      truncateToMinute(utcToZonedTime(startEquipmentTime, timezone)),
      {
        nearestTo: 15,
        roundingMethod: 'floor',
      }
    );
    const diffMs = differenceInMilliseconds(zonedStartTime, zonedStartEquipmentTime);
    additionalStartTime = diffMs / (1000 * 60 * 60);
    // Ensure no negative time
    if (additionalStartTime < 0) {
      additionalStartTime = 0;
    }
    totalEquipmentTime += additionalStartTime;
  }

  // The 1 extra hour is for drive time if no equipment time is set
  let additionalEndTime = includeDriveTime ? 1 : 0;
  if (endEquipmentTime) {
    const zonedEndEquipmentTime = roundToNearestMinutes(
      truncateToMinute(utcToZonedTime(endEquipmentTime, timezone)),
      {
        nearestTo: 15,
        roundingMethod: 'ceil',
      }
    );
    const diffMs = differenceInMilliseconds(zonedEndEquipmentTime, zonedEndTime);
    additionalEndTime = diffMs / (1000 * 60 * 60);
    // Ensure at least 1 hour for drive time
    if (additionalEndTime < 1) {
      additionalEndTime = includeDriveTime ? 1 : 0;
    }
    totalEquipmentTime += additionalEndTime;
  }

  const zoneStartTime = roundToNearestMinutes(
    subHours(zonedStartTime, additionalStartTime),
    {
      nearestTo: 15,
      roundingMethod: 'floor',
    }
  );
  const zoneEndTime = roundToNearestMinutes(
    addHours(zonedEndTime, additionalEndTime),
    {
      nearestTo: 15,
      roundingMethod: 'ceil',
    }
  );

  const diff = differenceInMinutes(zoneEndTime, zoneStartTime, { roundingMethod: 'ceil' });

  // convert total minutes to hours as a float, rounded to 2 decimals
  const formattedDiff = Number((diff / 60).toFixed(2));
  
  return {
    startTime: zoneStartTime,
    endTime: zoneEndTime,
    formattedDiff,
    totalEquipmentTime,
  };
};
