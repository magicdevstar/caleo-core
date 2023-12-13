import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";
import { MongoClient } from "mongodb";
import { mongo } from "./mongodb";

const client = new CognitoIdentityProviderClient({
  region: 'us-west-2',
});

const getUserByEmail = async (email: string) => {
  try {
    const input = { // ListUsersRequest
      UserPoolId: process.env.POOL_ID,
      Limit: 1,
      Filter: `email="${email}"`,
    };
    const command = new ListUsersCommand(input);
    const response = await client.send(command);

    return response.Users?.[0].Username;
  } catch(error) {
    console.error(error);
    return null;
  }
};

(async () => {
  let connection: MongoClient | undefined;
  try {
    connection = await mongo.connect();
    const users = connection.db('caleo-prod').collection('users');

    const updates: any = [];

    for await (const user of users.find({})) {
      const username = await getUserByEmail(user.member.contactInfo.primaryEmail.address);
      if (username && user.cognitoId !== username) {
        updates.push({
          updateOne: {
            filter: { _id: user._id },
            update: { $set: {cognitoId: username} },
          },
        });
        // console.log(`Updating: ${user.cognitoId} -> ${username}`);
        // await users.updateOne({ _id: user._id }, { $set: {cognitoId: username} });
      }
    }
    users.bulkWrite(updates);
  } catch(error) {
    console.error(error);
  } finally {
    if (connection) {
      await (connection).close();
    }
  }
})();
