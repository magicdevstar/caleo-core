import { Collection, Db, ObjectId } from "mongodb";
import { utcToZonedTime } from 'date-fns-tz';
import { endOfDay, getDay, getHours, getMinutes, setHours, setMilliseconds, setMinutes, setSeconds } from 'date-fns';

const dayOfWeek = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday', // [6]
];

const createAvailability = (shift: any, timezone: string = 'America/Los_Angeles') => {
  const startTime = utcToZonedTime(shift.startTime, timezone);
  const endTime = utcToZonedTime(shift.endTime, timezone);

  const startDay = getDay(startTime);
  const endDay = getDay(endTime);

  const inBetweenDays: number[] = [];
  if (startDay !== endDay) {
    let inBetween = (startDay + 1) % dayOfWeek.length;
    while(inBetween !== endDay) {
      inBetweenDays.push(inBetween);
      inBetween = ((inBetween + 1) % dayOfWeek.length);
    }
  }

  return dayOfWeek.reduce((acc, day, index) => {
    acc[day] = {} as {startTime: Date; endTime: Date;};
    if (index === startDay) {
      if (endDay !== startDay) {
        acc[day]!.endTime = endOfDay(new Date(0));
      }
      const withHoursSet = setHours(new Date(0), getHours(startTime));
      const withMinutesSet = setMinutes(withHoursSet, getMinutes(startTime));
      acc[day]!.startTime = withMinutesSet;
    }
    if (index === endDay) {
      if (endDay !== startDay) {
        acc[day]!.startTime = new Date(0);
      }
      const withHoursSet = setHours(new Date(0), getHours(endTime));
      const withMinutesSet = setMinutes(withHoursSet, getMinutes(endTime));
      acc[day]!.endTime = withMinutesSet;
    }
    if (inBetweenDays.includes(index)) {
      acc[day] = {
        startTime: new Date(0),
        endTime: endOfDay(new Date(0)),
      };
    }
    if (index !== startDay && index !== endDay && !inBetweenDays.includes(index)) {
      acc[day] = null;
    }
    return acc;
  }, {} as Record<string, {startTime: Date; endTime: Date;} | null>);
}

export const fixShiftAvailability = async (prodDb: Db) => {
  try {
    let bulkUpdates: any[] = [];
    const MAX_UPDATES = 5000;

    const submitUpdates = async (empty: boolean = true) => {
      if ((bulkUpdates.length > 0 && empty) || bulkUpdates.length === MAX_UPDATES) {
        console.log('Submitting updates...', bulkUpdates.length);
        // const res = await prodDb.collection('shifts').bulkWrite(bulkUpdates);
        // console.log(res);
        bulkUpdates = [];
      }
    }

    for await (const shift of prodDb.collection('shifts').aggregate([
      {
        $group: {
          _id: '$shiftId',
          items: {
            $addToSet: {
              availability: "$availability",
              startTime: "$startTime",
              endTime: "$endTime"
            }
          }
        }
      }
    ])) {
      const availability = createAvailability({
        startTime: shift.items[0].startTime,
        endTime: shift.items[0].endTime
      });

      if (JSON.stringify(availability) !== JSON.stringify(shift.items[0].availability)) {
        console.log('No match!', shift._id, JSON.stringify(availability, null, 2), JSON.stringify(shift.items[0].availability, null, 2));
        bulkUpdates.push({
          updateMany: {
            filter: { shiftId: shift._id },
            update: {
              $set: {
                availability: createAvailability({
                  startTime: shift.items[0].startTime,
                  endTime: shift.items[0].endTime
                })
              }
            }
          }
        });
        await submitUpdates(false);
      }

    }
    await submitUpdates(true);
  } catch(error) {
    console.error('Failed to update shifts: ', error);
  }
}