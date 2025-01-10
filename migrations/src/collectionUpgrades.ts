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
  try {
    connection = await mongo.connect();
    connectionProd = await mongoProd.connect();
    const mongoClient = connection.db('caleo-dev');
    // const mongoClient = connectionProd.db('caleo-prod'); 

    // await lotteryCounter(mongoClient.collection('lotteryCounter'));
    // await memberSkills(mongoClient.collection('memberSkills'));
    // await ranks(mongoClient.collection('ranks'));
    // await shiftBufferRequests(mongoClient.collection('shiftBufferRequests'));
    // await siteLock(mongoClient.collection('siteLock'));
    // await skills(mongoClient.collection('skills'));
    // await venues(mongoClient.collection('venues'));
    // await memberNotifications(mongoClient.collection('memberNotifications'));
    // await assignments(mongoClient.collection('assignments'));
    // await events(mongoClient.collection('events'));
    // await shiftLotteryRequests(mongoClient.collection('shiftLotteryRequests'));
    // await users(mongoClient.collection('users'));
    await shifts(mongoClient.collection('shifts'));
  } catch(error) {
    console.error('Failed to migrate: ', error);
  } finally {
    if (connectionProd) {
      await (connectionProd).close();
    }
    if (connection) {
      await (connection).close();
    }
  }
})();
