import { toZonedTime } from "date-fns-tz";
import {
  differenceInMinutes,
  roundToNearestMinutes,
  differenceInHours
} from "date-fns";

/**
 * Calculates hours worked to the nearest quarter and total equpiment time.
 * @param arg Object containing check-in time, check-out time, timezone, and optional start and end equipment times.
 * @returns Object containing hours worked and total equipment time, all rounded to the nearest quarter time.
 */
export const calculateCheckInOutHours = ({
  startTime,
  endTime,
  timezone,
  startEquipmentTime,
  endEquipmentTime,
} : {
  startTime: string;
  endTime: string;
  timezone: string;
  startEquipmentTime?: string;
  endEquipmentTime?: string;
}) => {
  const zonedStartTime = toZonedTime(startTime, timezone);
  const zonedEndTime = toZonedTime(endTime, timezone);

  let totalEquipmentTime = 0;
  if (startEquipmentTime) {
    const zonedStartEquipmentTime = toZonedTime(startEquipmentTime, timezone);
    let equipmentDiff = differenceInHours(zonedStartTime, zonedStartEquipmentTime, { roundingMethod: 'ceil' });
    // Ensure no negative time
    if (equipmentDiff < 0) {
      equipmentDiff = 0;
    }
    totalEquipmentTime += equipmentDiff;
  }

  if (endEquipmentTime) {
    const zonedEndEquipmentTime = toZonedTime(endEquipmentTime, timezone);
    totalEquipmentTime += differenceInHours(zonedEndEquipmentTime, zonedEndTime, { roundingMethod: 'ceil' });
  }

  const roundedZonedStartTime = roundToNearestMinutes(
    zonedStartTime,
    {
      nearestTo: 15,
      roundingMethod: 'floor',
    }
  );
  const roundedZonedEndTime = roundToNearestMinutes(
    zonedEndTime,
    {
      nearestTo: 15,
      roundingMethod: 'ceil',
    }
  );

  const diff = differenceInMinutes(roundedZonedEndTime, roundedZonedStartTime, { roundingMethod: 'ceil' });

  // convert total minutes to hours as a float, rounded to 2 decimals
  const formattedDiff = Number((diff / 60).toFixed(2));

  return {
    hoursWorked: formattedDiff,
    totalEquipmentTime,
  };
};
