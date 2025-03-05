import { Collection, Db, ObjectId } from "mongodb";
import { uniq, difference } from "lodash";

const fullRankNames = uniq([
  "Deputy, Generalist",
  "Deputy, Generalist Motor",
  "Deputy, Generalist Observer",
  "Deputy, Bonus I",
  "Deputy, Bonus I - SEB/ESD",
  "Deputy, Bonus I (Master Field Training Officer)",
  "Deputy, Bonus I (Motor)",
  "Deputy, Bonus II",
  "Deputy, Bonus II (Arson/Explosives)",
  "Deputy, Bonus II (Hazardous Materials)",
  "Deputy, Bonus II (Pilot)",
  "Deputy, Bonus II (SEB/ESD)",
  "Deputy, Reserve",
  "Sergeant",
  "Sergeant, (Arson/Explosives)",
  "Sergeant, (Hazardous Materials)",
  "Sergeant, Motor",
  "Sergeant, Pilot",
  "Sergeant, (SEB/ESD)",
  "Lieutenant",
  "Captain",
  "Commander",
  "Assistant Director, Bureau Operations",
  "Assistant Automotive Equipment Coordinator",
  "Assistant Supervising Payroll Clerk",
  "Civilian Investigator",
  "Combo Truck Driver",
  "Community Services Assistant (CSA)",
  "Crime Analyst",
  "Criminalist",
  "Criminalistics Lab Technician",
  "Custodian",
  "Custody Assistant",
  "Custody Assistant, Patrol",
  "Digital Systems Technician",
  "Electrician",
  "Electrician Supervisor",
  "Electronic Audio Technician",
  "Electronic Communication Equipment Installer",
  "Electronic Communications Technician",
  "Employment Services Assistant I",
  "Employment Services Assistant II",
  "Employment Services Assistant III",
  "Evidence & Property Custodian I",
  "Evidence & Property Custodian II",
  "Evidence & Property Custodian III",
  "Evidence & Property Custodian, Supervising",
  "Forensic ID Specialist I",
  "Forensic ID Specialist II",
  "Forensic ID Specialist, Supervising",
  "General Maintenance Worker",
  "Helicopter Maintenance Inspector",
  "Helicopter Mechanic",
  "Information Systems Analyst I",
  "Information Systems Analyst II",
  "Intermediate Clerk",
  "Intermediate Stenographer",
  "Intermediate Typist Clerk",
  "Inventory Control Assistant I",
  "Law Enforcement Technician",
  "Marshal's Dispatcher I",
  "Matron",
  "Management Secretary V",
  "Medium Truck Driver",
  "Operations Assistant I",
  "Operations Assistant II",
  "Operations Assistant III",
  "Parking Control Officer",
  "Payroll Clerk I",
  "Payroll Clerk II",
  "Plumber",
  "Power Equipment Technician",
  "Procurement Assistant II",
  "Public Response Dispatcher II",
  "Public Response Dispatcher Specialist",
  "Public Response Dispatcher, Supervisor",
  "Records Systems Clerk I",
  "Records Systems Clerk III",
  "Refrigerator Mechanic",
  "Secretary I",
  "Secretary V",
  "Security Assistant",
  "Security Officer",
  "Senior Application Developer",
  "Senior Clerk",
  "Senior Criminalist",
  "Senior Electronic Communications Technician",
  "Senior Equipment Maintenance Worker",
  "Senior Helicopter Mechanic",
  "Senior Information Systems Analyst",
  "Senior Information Technology Support Analyst",
  "Senior Secretary II",
  "Senior Secretary V",
  "Senior Operating Systems Analyst",
  "Senior Typist-Clerk",
  "Sheet Metal Worker",
  "Sheriff Station Clerk I",
  "Sheriff Station Clerk II",
  "Student Professional Worker",
  "Student Worker",
  "Supervising Criminalist",
  "Supervising Parking Control Officer",
  "Supervising Payroll Clerk II",
  "Supervising Sheriff Station Clerk",
  "Telephone Operator",
  "Warehouse Manager",
  "Warehouse Worker II",
  "Word Processor II"
]);

const skills = [
  {name: "EOB SGT",requiresApproval: true, requiresCert: false, rankNames: "Sergeant"},
  {name: "EOB Deputy (Tac Planning)",requiresApproval: true,requiresCert: false, rankNames: "Deputy, Generalist; Deputy, Reserve"},
  {name: "EOB Deputy (Logistics)",requiresApproval: true,requiresCert: false, rankNames: "Deputy, Generalist; Deputy, Bonus I"},
  {name: "Resource Unit Staff",requiresApproval: true,requiresCert: false, rankNames: "Deputy, Generalist; Operations Assistant I; Operations Assistant II; Operations Assistant III; Secretary I; Secretary V; Senior Secretary II; Senior Secretary V; Law Enforcement Technician"},
  {name: "Bicycle",requiresApproval: true,requiresCert: false, rankNames: "Deputy, Generalist; Deputy, Reserve"},
  {name: "UTV",requiresApproval: true,requiresCert: false, rankNames: "Deputy, Generalist; Deputy, Reserve; Deputy, Bonus I; Deputy, Bonus II; Deputy, Bonus I - SEB/ESD; Deputy, Bonus II (Arson/Explosives); Deputy, Bonus II (Hazardous Materials); Deputy, Bonus II (Pilot); Deputy, Bonus II (SEB/ESD)"},
  {name: "Dispatcher",requiresApproval: true,requiresCert: false, rankNames: "Public Response Dispatcher II; Public Response Dispatcher Specialist; Public Response Dispatcher, Supervisor"},
  {name: "Motor",requiresApproval: true,requiresCert: false, rankNames: "Deputy, Generalist Motor; Deputy, Bonus I (Motor); Sergeant, Motor"},
  {name: "Mounted Enforcement",requiresApproval: true,requiresCert: false, rankNames: "Deputy, Generalist; Deputy, Bonus I; Sergeant"},
  {name: "ESD",requiresApproval: true,requiresCert: false, rankNames: "Deputy, Bonus I - SEB/ESD; Deputy, Bonus II (Arson/Explosives); Deputy, Bonus II (Hazardous Materials); Deputy, Bonus II (SEB/ESD); Sergeant, (SEB/ESD); Sergeant, (Arson/Explosives); Sergeant, (Hazardous Materials)"},
  {name: "HAZMAT",requiresApproval: true,requiresCert: false, rankNames: "Deputy, Bonus I - SEB/ESD; Deputy, Bonus II (Arson/Explosives); Deputy, Bonus II (Hazardous Materials); Deputy, Bonus II (SEB/ESD); Sergeant, (SEB/ESD); Sergeant, (Arson/Explosives); Sergeant, (Hazardous Materials)"},
  {name: "AED",requiresApproval: true,requiresCert: false, rankNames: "Deputy, Bonus I - SEB/ESD; Deputy, Bonus II (Arson/Explosives); Deputy, Bonus II (Hazardous Materials); Deputy, Bonus II (SEB/ESD); Sergeant, (SEB/ESD); Sergeant, (Arson/Explosives); Sergeant, (Hazardous Materials)"},
  {name: "K9 (Explosives)",requiresApproval: true,requiresCert: false, rankNames: "Deputy, Generalist; Deputy, Bonus I; Sergeant"},
  {name: "K9 (Apprehension)",requiresApproval: true,requiresCert: false, rankNames: "Deputy, Bonus I - SEB/ESD; Deputy, Bonus II (Arson/Explosives); Deputy, Bonus II (Hazardous Materials); Deputy, Bonus II (SEB/ESD); Sergeant, (SEB/ESD); Sergeant, (Arson/Explosives); Sergeant, (Hazardous Materials)"},
  {name: "Patrol Trained",requiresApproval: true,requiresCert: false, rankNames: "All Deputy Ranks"},
  {name: "SRT",requiresApproval: true,requiresCert: false, rankNames: "All Deputy Ranks; All Sergeant Ranks; All Lieutenant Ranks"}
];

const orgId = new ObjectId("67c78e42035889550ba0baca");
const createdById = new ObjectId("67c78e86afc5d0ad1c94bcca");

export const importSkills = async (db: Db) => {
  const rankCollection = db.collection('ranks');
  const skillsCollection = db.collection('skills');
  try {
    let insert: any[] = [];
    for(const s of skills) {
      let rankNames: string[] = uniq(s.rankNames.split(';').map((r: string) => r.trim()));
      let additionalRanks: string[] = [];
      if (rankNames.includes('All Deputy Ranks')) {
        additionalRanks.push(...fullRankNames.filter((r: string) => r.includes('Deputy, ')));
      }

      if (rankNames.includes('All Sergeant Ranks')) {
        additionalRanks.push(...fullRankNames.filter((r: string) => r.includes('Sergeant')));
      }

      if (rankNames.includes('All Lieutenant Ranks')) {
        additionalRanks.push(...fullRankNames.filter((r: string) => r.includes('Lieutenant')));
      }

      rankNames = uniq([
        ...rankNames.filter((r: string) => r !== 'All Deputy Ranks' && r !== 'All Sergeant Ranks' && r !== 'All Lieutenant Ranks'),
        ...additionalRanks
      ]);

      const ranks = await rankCollection.find({name: {$in: rankNames}, orgId}).toArray();
      const rankOnlyIds = ranks.map((r: any) => r._id);
      const existingRanks = ranks.map((r: any) => r.name);

      if (rankNames.length !== rankOnlyIds.length) {
        const missingRanks = difference(rankNames, existingRanks);
        console.error('Failed to find ranks: ', s.name, rankNames.length, rankOnlyIds.length, missingRanks);
        continue;
      }

      const skill = {
        name: s.name,
        active: true,
        requiresAdminApproval: s.requiresApproval,
        requiresCert: s.requiresCert,
        orgId,
        docType: "SKILL",
        modifiedById: createdById,
        createdById: createdById,
        createdAt: new Date(),
        updatedAt: new Date(),
        rankOnlyIds,
      };
      insert.push(skill);
    }

    // console.log(insert.length);
    await skillsCollection.insertMany(insert);
  } catch(error) {
    console.error('Failed to update shifts: ', error);
  }
}
