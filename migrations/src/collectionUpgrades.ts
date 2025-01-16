import { MongoClient } from "mongodb";
import { mongo, mongoProd } from "./utils/mongodb";
import { memberNotifications } from "./utils/collectionMigration/memberNotifications";
import { assignments } from "./utils/collectionMigration/assignments";
import { lotteryCounter } from "./utils/collectionMigration/lotteryCounter";
import { memberSkills } from "./utils/collectionMigration/memberSkills";
import { ranks } from "./utils/collectionMigration/ranks";
import { shiftBufferRequests } from "./utils/collectionMigration/shiftBufferRequests";
import { siteLock } from "./utils/collectionMigration/siteLock";
import { skills } from "./utils/collectionMigration/skills";
import { venues } from "./utils/collectionMigration/venues";
import { events } from "./utils/collectionMigration/events";
import { shiftLotteryRequests } from "./utils/collectionMigration/shiftLotteryRequests";
import { users } from "./utils/collectionMigration/users";
import { shifts } from "./utils/collectionMigration/shifts";

(async () => {
  let connection: MongoClient | undefined;
  let connectionProd: MongoClient | undefined;
  // let connectionLocal: MongoClient | undefined;
  try {
    connection = await mongo.connect();
    connectionProd = await mongoProd.connect();
    // connectionLocal = await mongoLocal.connect();
    // const mongoClient = connectionLocal.db('caleo-prod');
    // const mongoClient = connection.db('caleo-dev');
    const mongoClient = connectionProd.db('caleo-prod'); 

    await lotteryCounter(mongoClient.collection('lotteryCounter'));
    console.log('lotteryCounter done');
    await memberSkills(mongoClient.collection('memberSkills'));
    console.log('memberSkills done');
    await ranks(mongoClient.collection('ranks'));
    console.log('ranks done');
    await shiftBufferRequests(mongoClient.collection('shiftBufferRequests'));
    console.log('shiftBufferRequests done');
    await siteLock(mongoClient.collection('siteLock'));
    console.log('siteLock done');
    await skills(mongoClient.collection('skills'));
    console.log('skills done');
    await venues(mongoClient.collection('venues'));
    console.log('venues done');
    await memberNotifications(mongoClient.collection('memberNotifications'));
    console.log('memberNotifications done');
    await assignments(mongoClient.collection('assignments'));
    console.log('assignments done');
    await events(mongoClient.collection('events'));
    console.log('events done');
    await shifts(mongoClient.collection('shifts'));
    console.log('shifts done');
    await users(mongoClient.collection('users'));
    console.log('users done');
    await shiftLotteryRequests(mongoClient.collection('shiftLotteryRequests'));
    console.log('shiftLotteryRequests done');
  } catch(error) {
    console.error('Failed to migrate: ', error);
  } finally {
    if (connectionProd) {
      await (connectionProd).close();
    }
    if (connection) {
      await (connection).close();
    }
    // if (connectionLocal) {
    //   await (connectionLocal).close();
    // }
  }
})();
