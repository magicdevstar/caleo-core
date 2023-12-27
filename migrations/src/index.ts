import { MongoClient } from "mongodb";
import { mongo, mongoProd } from "./utils/mongodb";
import { mysql } from "./utils/mysql";
import { venues } from "./venues"
import { ranks } from "./ranks"
import { skills } from "./skills";
import { setTierUntil, users } from "./users";
import { memberSkills } from "./memberSkills";
import { lotteryCounter } from "./lotteryCounter";
import { events, adjustEventTimes } from "./events";
import { assignments, scheduleShiftReminders } from "./assignments";
import { shifts } from "./shifts";
import { shiftRequest } from "./shiftRequests";
import { fixMe } from "./utils/fix-me";
import { shiftOverlap } from "./utils/shift-overlap";
import { schedulerFix } from "./utils/scheduler-update";
import { unassignmentCSV } from "./utils/unassignment-csv";
import { availabilityMap } from "./utils/avail-fix";

(async () => {
  let connection: MongoClient | undefined;
  let connectionProd: MongoClient | undefined;
  try {
    connection = await mongo.connect();
    connectionProd = await mongoProd.connect();
    const mongoClient = connection.db(process.env.DB);
    const mongoClientProd = connectionProd.db(process.env.DB);

    // await fixMe(mongoClient, mongoClientProd);
    // await shiftOverlap(mongoClient, mongoClientProd);
    // await unassignmentCSV(mongoClientProd);
    // await schedulerFix(mongoClientProd);
    // await availabilityMap(mongoClientProd);

    await venues(mongoClient.collection('venues'));
    await ranks(mongoClient.collection('ranks'));
    await skills(mongoClient.collection('skills'), mongoClient);
    await users(mongoClient.collection('users'), mongoClient);
    await memberSkills(mongoClient.collection('memberSkills'), mongoClient);
    await lotteryCounter(mongoClient.collection('lotteryCounter'));
    await events(mongoClient.collection('events'), mongoClient);
    await assignments(mongoClient.collection('assignments'), mongoClient);
    const minMaxMap = await shifts(mongoClient.collection('shifts'), mongoClient);
    await adjustEventTimes(mongoClient.collection('events'), minMaxMap);
    await shiftRequest(mongoClient.collection('shiftLotteryRequests'), mongoClient);

    // await setTierUntil(mongoClient.collection('users'), mongoClient);
    // await scheduleShiftReminders(mongoClient.collection('shifts'), mongoClient);
  } catch(error) {
    console.error('Failed to migrate: ', error);
  } finally {
    await mysql.destroy();
    if (connectionProd) {
      await (connectionProd).close();
    }
    if (connection) {
      await (connection).close();
    }
  }
})();
