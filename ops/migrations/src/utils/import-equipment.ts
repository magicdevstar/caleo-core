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

const orgId = new ObjectId("67c78e42035889550ba0baca");
const createdById = new ObjectId("67c78e86afc5d0ad1c94bcca");

export const importEquipment = async (db: Db) => {
  const rankCollection = db.collection('ranks');
  const equipmentsCollection = db.collection('equipments');
  try {
    let insert: any[] = [];
    for(const e of equipment) {
      const rankNames = uniq(e.rankNames.split(';').map((r: string) => r.trim()));
      const ranks = await rankCollection.find({name: {$in: rankNames}, orgId}).toArray();
      const rankOnlyIds = ranks.map((r: any) => r._id);
      const existingRanks = ranks.map((r: any) => r.name);

      if (rankNames.length !== rankOnlyIds.length) {
        const missingRanks = difference(rankNames, existingRanks);
        console.error('Failed to find ranks: ', e.name, rankNames.length, rankOnlyIds.length, missingRanks);
        continue;
      }

      const equipment = {
        name: e.name,
        active: true,
        requiresAdminApproval: e.requiresAdminApproval,
        requiresCert: e.requiresCertificate,
        orgId,
        docType: "EQUIPMENT",
        modifiedById: createdById,
        createdById: createdById,
        createdAt: new Date(),
        updatedAt: new Date(),
        rankOnlyIds,
      };
      insert.push(equipment);
    }

    // console.log(insert.length);
    await equipmentsCollection.insertMany(insert);
  } catch(error) {
    console.error('Failed to update shifts: ', error);
  }
}
