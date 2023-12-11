import { MongoClient } from "mongodb";
import { mongo } from "./utils/mongodb";
import { mysql } from "./utils/mysql";
import { venues } from "./venues"
import { ranks } from "./ranks"
import { skills } from "./skills";
import { users } from "./users";
import { memberSkills } from "./memberSkills";
import { lotteryCounter } from "./lotteryCounter";
import { events } from "./events";
import { assignments } from "./assignments";

(async () => {
  let connection: MongoClient | undefined;
  try {
    connection = await mongo.connect();
    const mongoClient = connection.db('caleo-prod')
    await venues(mongoClient.collection('venues'));
    await ranks(mongoClient.collection('ranks'));
    await skills(mongoClient.collection('skills'), mongoClient);
    await users(mongoClient.collection('users'), mongoClient);
    await memberSkills(mongoClient.collection('memberSkills'), mongoClient);
    // await lotteryCounter(mongoClient.collection('lotteryCounter'));
    await events(mongoClient.collection('events'), mongoClient);
    await assignments(mongoClient.collection('assignments'), mongoClient);
  } catch(error) {
    console.error('Failed to migrate: ', error);
  } finally {
    await mysql.destroy();
    if (connection) {
      await (connection).close();
    }
  }
})();
