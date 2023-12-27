import { Db, ObjectId } from "mongodb";
import { utcToZonedTime } from 'date-fns-tz';
import { endOfDay, getDay, getHours, getMinutes, setHours, setMinutes } from 'date-fns';
import { Shift } from "./resolvers-types";

const dayOfWeek = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday', // [6]
];

const createAvailability = (shift: Shift, timezone: string) => {
  const startTime = utcToZonedTime(new Date(shift.startTime), timezone);
  const endTime = utcToZonedTime(new Date(shift.endTime), timezone);

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
    acc[day] = {};
    if (index === startDay) {
      if (endDay !== startDay) {
        acc[day].endTime = endOfDay(new Date(0));
      }
      const withHoursSet = setHours(new Date(0), getHours(startTime));
      const withMinutesSet = setMinutes(withHoursSet, getMinutes(startTime));
      acc[day].startTime = withMinutesSet;
    }
    if (index === endDay) {
      if (endDay !== startDay) {
        acc[day].startTime = new Date(0);
      }
      const withHoursSet = setHours(new Date(0), getHours(endTime));
      const withMinutesSet = setMinutes(withHoursSet, getMinutes(endTime));
      acc[day].endTime = withMinutesSet;
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
  }, {} as any);
};

export const availabilityMap = async (prodDb: Db) => {
  const shiftsCollection = await prodDb.collection('shifts');
  const organizationCollection = await prodDb.collection('organizations');
  // const shift = await shiftsCollection.findOne({
  //   shiftId: '19a2eddc-5f12-4e5a-b3af-64d39a11865c',
  // });
  const organization = await organizationCollection.findOne({
    _id: new ObjectId('64cd5e262c436093a2b7e680'),
  });

  const counter = {total: 0, updated: 0};
  const updates: any = []
  for await (const shift of shiftsCollection.find({
    updatedAt: {$gte: 1702965600000}
  })) {
    counter.total++;
    const availability = createAvailability(shift as any, organization!.timezone);
    if (JSON.stringify(shift.availability) !== JSON.stringify(availability)) {
      counter.updated++;
      updates.push({
        updateOne: {
          filter: {
            _id: shift._id,
          },
          update: {
            $set: {
              availability,
            },
          },
        },
      });
    }
  }
  
  console.log('counter: ', counter);
  const res = await shiftsCollection.bulkWrite(updates);
  console.log('res: ', JSON.stringify(res, null, 2));
};
