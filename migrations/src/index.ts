import { MongoClient } from "mongodb";
import { mongo } from "./utils/mongodb";
import { mysql } from "./utils/mysql";
import { venues } from "./venues"
import { ranks } from "./ranks"
import { skills } from "./skills";

(async () => {
  let connection: MongoClient | undefined;
  try {
    connection = await mongo.connect();
    const mongoClient = connection.db('caleo-prod')
    await venues(mongoClient.collection('venues'));
    await ranks(mongoClient.collection('ranks'));
    await skills(mongoClient.collection('skills'), mongoClient);
  } catch(error) {
    console.error('Failed to migrate: ', error);
  } finally {
    await mysql.destroy();
    if (connection) {
      await (connection).close();
    }
  }
})();
