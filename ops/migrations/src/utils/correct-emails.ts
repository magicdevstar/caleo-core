import { Collection, Db, ObjectId } from "mongodb";
import { uniq, difference } from "lodash";

const equipment = [
  {name: "EOB Logistics Truck", requiresAdminApproval: true, requiresCertificate: false, rankNames: "Deputy, Generalist; Deputy, Bonus I; Deputy, Bonus II; Sergeant"},
  {name: "EOB Logistics UTV's",requiresAdminApproval: true, requiresCertificate: false, rankNames: "Deputy, Generalist; Deputy, Bonus I; Deputy, Bonus II; Sergeant"},
  {name: "AED Bomb Truck",requiresAdminApproval: true,requiresCertificate: false, rankNames: "Deputy, Generalist; Deputy, Bonus I; Deputy, Bonus II; Deputy, Bonus I - SEB/ESD; Deputy, Bonus II (Arson/Explosives); Deputy, Bonus II (Hazardous Materials); Deputy, Bonus II (SEB/ESD); Sergeant; Sergeant, (Arson/Explosives); Sergeant, (Hazardous Materials); Sergeant, (SEB/ESD) "},
  {name: "AED UTV",requiresAdminApproval: true,requiresCertificate: false, rankNames: "Deputy, Generalist; Deputy, Bonus I; Deputy, Bonus II; Deputy, Bonus I - SEB/ESD; Deputy, Bonus II (Arson/Explosives); Deputy, Bonus II (Hazardous Materials); Deputy, Bonus II (SEB/ESD); Sergeant; Sergeant, (Arson/Explosives); Sergeant, (Hazardous Materials); Sergeant, (SEB/ESD) "},
  {name: "Patrol Vehicle",requiresAdminApproval: true,requiresCertificate: false, rankNames: "Deputy, Generalist; Deputy, Bonus I; Deputy, Bonus II; Deputy, Bonus I - SEB/ESD; Deputy, Bonus II (Arson/Explosives); Deputy, Bonus II (Hazardous Materials); Deputy, Bonus II (SEB/ESD); Sergeant; Sergeant, (Arson/Explosives); Sergeant, (Hazardous Materials); Sergeant, (SEB/ESD) "},
  {name: "Mounted Enforcement",requiresAdminApproval: true,requiresCertificate: false, rankNames: "Deputy, Generalist; Deputy, Bonus I; Deputy, Bonus II; Deputy, Bonus I - SEB/ESD; Deputy, Bonus II (Arson/Explosives); Deputy, Bonus II (Hazardous Materials); Deputy, Bonus II; Sergeant, (SEB/ESD); Sergeant; Sergeant, (Arson/Explosives); Sergeant, (Hazardous Materials); Sergeant, (SEB/ESD) "}
];

const orgId = new ObjectId("679843c6bc5fc11585a745b6");
const createdById = new ObjectId("6798464cbc5fc11585a745b7");

export const correctEmails = async (db: Db) => {
  const users = db.collection('users');
  try {
    const updates: any[] = [];
    for await (const user of users.find({})) {
      const existingEmail = user.member.contactInfo.primaryEmail.address;
      const lowercase = user.member.contactInfo.primaryEmail.address.toLowerCase();
      if (existingEmail !== lowercase) {
        updates.push({
          updateOne: {
            filter: { _id: user._id },
            update: {
              $set: {
                "member.contactInfo.primaryEmail.address": lowercase,
              }
            }
          }
        });
      }
    }

    const res = await users.bulkWrite(updates);
    console.log(JSON.stringify(res, null, 2));
    // console.log(`Updating ${updates.length} users`);
  } catch(error) {
    console.error('Failed to update shifts: ', error);
  }
}
