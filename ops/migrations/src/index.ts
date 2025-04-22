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
import { tierChecker } from './utils/tier-scheduler-check';
import { analytics } from "./utils/analytics";
import { noAssignCounter } from "./utils/no-assign-counter";
import { fixDupUsers } from "./utils/fix-duplicate-users";
import { lottoAnalytics } from "./utils/lotto-analytics";
// import { shiftRefMigration } from "./utils/shift-ref-update";
import { unassignedShiftsCounter } from "./utils/unassignedShifts";
import { migrateCollectionToV2 } from "./utils/migrateCollectionToV2";
import { removeOldShifts } from './utils/remove-old-shifts';
import { lottoAnalysis } from './utils/lotto-analysis';
import { fixShiftAvailability } from "./utils/fix-shift-availability";
import { analysisLotto58 } from "./utils/analysis-lotto-58";
import { importRank } from './utils/import-rank';
import { importEquipment } from './utils/import-equipment';
import { importSkills } from "./utils/import-skills";
import { correctEmails } from "./utils/correct-emails";
import { importUnitsAndDivisions } from "./utils/import-units-and-divisions";
// import { wtf } from './utils/wtf';

(async () => {
  let connection: MongoClient | undefined;
  let connectionProd: MongoClient | undefined;
  try {
    connection = await mongo.connect();
    connectionProd = await mongoProd.connect();
    const mongoClient = connection.db('caleo-dev'); // process.env.DB);
    const mongoClientProd = connectionProd.db(process.env.DB);

    await importUnitsAndDivisions(mongoClientProd);
    
    // await correctEmails(mongoClient);

    // await importSkills(mongoClientProd);
    // await importEquipment(mongoClientProd);
    // await importRank(mongoClientProd);
    
    // await analysisLotto58(mongoClientProd);
    // await fixShiftAvailability(mongoClientProd);
    // await lottoAnalysis(mongoClientProd, 57);
    // await removeOldShifts(mongoClientProd);
    // await migrateCollectionToV2(mongoClient.collection('memberNotifications'));
    // await unassignedShiftsCounter(mongoClientProd);
    // await shiftRefMigration(mongoClient)
    // await lottoAnalytics(mongoClientProd);
    // await fixDupUsers(mongoClientProd);
    // await tierChecker(mongoClientProd);
    // await fixMe(mongoClient, mongoClientProd);
    // await shiftOverlap(mongoClient, mongoClientProd);
    // await noAssignCounter(mongoClientProd);
    // await unassignmentCSV(mongoClientProd);
    // await schedulerFix(mongoClientProd);
    // await availabilityMap(mongoClientProd);
    // await wtf(mongoClientProd);
    // await analytics(mongoClientProd);

    // await venues(mongoClient.collection('venues'));
    // await ranks(mongoClient.collection('ranks'));
    // await skills(mongoClient.collection('skills'), mongoClient);
    // await users(mongoClient.collection('users'), mongoClient);
    // await memberSkills(mongoClient.collection('memberSkills'), mongoClient);
    // await lotteryCounter(mongoClient.collection('lotteryCounter'));
    // await events(mongoClient.collection('events'), mongoClient);
    // await assignments(mongoClient.collection('assignments'), mongoClient);
    // const minMaxMap = await shifts(mongoClient.collection('shifts'), mongoClient);
    // await adjustEventTimes(mongoClient.collection('events'), minMaxMap);
    // await shiftRequest(mongoClient.collection('shiftLotteryRequests'), mongoClient);

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
