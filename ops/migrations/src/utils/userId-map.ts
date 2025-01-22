import { OldUser } from "../users";
import { mysql } from "./mysql";
import { getUserByEmail } from "./cognito-user-lookup";
import { readFileSync, writeFileSync } from "fs";

(async () => {
  try {
    const userMap = JSON.parse(readFileSync(`${__dirname}/../data/user-map.json`, 'utf8'));
    for await (const user of mysql<OldUser>('user').stream()) {
      if (userMap[user.email]) {
        continue;
      }
      const username = await getUserByEmail(user.email);
      userMap[user.email] = username;
    }
    writeFileSync(`${__dirname}/../data/user-map.json`, JSON.stringify(userMap, null, 2));
  } catch(error) {
    console.error(error);
  }
})();
