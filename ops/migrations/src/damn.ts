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

const pipeline = [
  {
    $match:
      /**
       * query: The query in MQL.
       */
      {
        $and: [
          {
            userId: {
              $exists: true
            }
          },
          {
            userId: {
              $ne: null
            }
          }
        ]
      }
  },
  {
    $addFields:
      /**
       * newField: The new field name.
       * expression: The new field expression.
       */
      {
        userId: {
          $toObjectId: "$userId"
        },
        orgId: {
          $toObjectId: "$orgId"
        }
      }
  },
  {
    $lookup:
      /**
       * from: The target collection.
       * localField: The local join field.
       * foreignField: The target join field.
       * as: The name for the results.
       * pipeline: Optional pipeline to run on the foreign collection.
       * let: Optional variables to use in the pipeline field stages.
       */
      {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
  },
  {
    $project:
      /**
       * specifications: The fields to
       *   include or exclude.
       */
      {
        user: {
          $arrayElemAt: ["$user", 0]
        },
        orgId: "$orgId"
      }
  },
  {
    $addFields:
      /**
       * newField: The new field name.
       * expression: The new field expression.
       */
      {
        "user.member.orgId": "$orgId"
      }
  },
  {
    $replaceRoot:
      /**
       * replacementDocument: A document or string.
       */
      {
        newRoot: "$user"
      }
  }
];

(async () => {
  let connection: MongoClient | undefined;
  let connectionProd: MongoClient | undefined;
  try {
    connection = await mongo.connect();
    // connectionProd = await mongoProd.connect();
    const mongoClient = connection.db('caleo-dev');
    const collection = mongoClient.collection('shifts');
    const users = mongoClient.collection('users');

    const userMap: Record<string, any> = {};
    for await (const user of collection.aggregate(pipeline)) {
      userMap[user._id.toString()] = user;
    }
    for (const user of Object.values(userMap)) {
      await users.updateOne(
        {
          _id: user._id
        },
        {
          $set: {
            'member.orgId': user.member.orgId,
          },
        }
      );
    }

    console.log('userMap: ', Object.keys(userMap).length);
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
