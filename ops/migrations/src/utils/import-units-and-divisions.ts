import { Collection, Db, ObjectId } from "mongodb";
import { uniq, difference } from "lodash";

const orgId = new ObjectId("64cd5e262c436093a2b7e680");
const createdById = new ObjectId("64cd7b46136ad45ad91187db");
const rawData = `Unit of Assigment,Overtime ID,Division
Access to Care Bureau,ACB,Custody Services Division - Specialized Programs
Advocacy Unit,ADV,Professional Standards Division
Aero Bureau,AERO,Special Operations Division
Altadena Station,ALD,East Patrol Division
Audit & Accountability Bureau,AAB,Office of Constitutional Policing
AV DOJ Compliance Unit,AVDOJCU,Office of Constitutional Policing
Avalon Station,AVA,Central Patrol Division
Bureau of Labor Relations & Compliance,BLRC,Personnel Command
Carson Station,CAS,South Patrol Division
Century Station,CEN,Central Patrol Division
Cerritos Station,CER,South Patrol Division
Civil Management Bureau,CMB,Court Services Division
Communications & Fleet Management Bureau,CFMB,Technology & Support Division
Community College Bureau,CCB,Countywide Services Division
Community Partnerships Bureau,CPB,Countywide Services Division
Compton Station,COM,Central Patrol Division
Contract Law Enforcement Bureau,CLEB,Administrative Services Division
County Services Bureau,CSB,Countywide Services Division
Court Services Central,CSC,Court Services Division
Court Services East,CSE,Court Services Division
Court Services Transportation Bureau,CSTB,Court Services Division
Court Services West,CSW,Court Services Division
CRDF,CRDF,Custody Services Division - Specialized Programs
Crescenta Valley Station ,CVS,East Patrol Division
Custody Compliance & Sustainability ,CCS,Custody Services Division - Specialized Programs
Custody Support Services Bureau,CSSB,Custody Services Division - Administration Command
Custody Training & Standards Bureau,CTSB,Custody Services Division - Administration Command
Data Systems Bureau,DSB,Technology & Support Division
East Los Angeles Station,ELA,Central Patrol Division
Emergency Operations Bureau,EOB,Special Operations Division
Facilities Planning Bureau,FPB,Administrative Services Division
Facilities Services Bureau,FSB,Administrative Services Division
Financial Programs Bureau,FPB,Administrative Services Division
Fiscal Administration Bureau,FAB,Administrative Services Division
Fraud & Cyber Crime Bureau,FCCB,Detective Division
Homicide Bureau,HOM,Detective Division
Industry Station,IDT,East Patrol Division
Inmate Reception Center,IRC,Custody Services Division - General Population
Inmate Services Bureau,ISB,Custody Services Division - Specialized Programs
Internal Affairs Bureau,IAB,Professional Standards Division
Internal Criminal Affairs Bureau,ICIB,Professional Standards Division
Lakewood Station Lomita Station,LKD,South Patrol Division
Lancaster Station,LAN,North Patrol Division
Major Crimes Bureau,MCB,Detective Division
Malibu/Lost Hills Station,LHS,North Patrol Division
Marina Del Rey Station,MDR,Central Patrol Division
Men's Central Jail,MCJ,Custody Services Division - General Population
Metrolink Bureau,MTB,Special Operations Division
Mira Loma Detention Facility,MRL,Custody Services Division - Specialized Programs
Narcotics Bureau,NARCO,Detective Division
North County Correctional Facility,NCCF,Custody Services Division - General Population
Norwalk Station,NWK,South Patrol Division
Operations Safe Streets Bureau,OSS,Detective Division
Palmdale Station,PLM,North Patrol Division
Parks Bureau,PKB,Countywide Services Division
PDC-East,PDCE,Custody Services Division - General Population
PDC-North,PDCN,Custody Services Division - General Population
PDC-South,PDCS,Custody Services Division - General Population
Personnel Administration Bureau,PAB,Personnel Command
Pico Rivera Station,PICO,South Patrol Division
Population Managements Bureau,PMB,Custody Services Division - General Population
Psychological Services Bureau,PSB,Personnel Command
Records & Identification Bureau,RIB,Technology & Support Division
Risk Management Bureau,RMB,Office of Constitutional Policing
San Dimas Station,SDM,East Patrol Division
Santa Clarita Valley Station,SCT,North Patrol Division
Scientific Services Bureau,SSB,Technology & Support Division
Sheriff's Information Bureau,SIB,Executive
South Los Angeles Station,SLA,Central Patrol Division
Special Enforcement Bureau,SEB,Special Operations Division
Special Victims Bureau,SVB,Detective Division
Temple Station,TEM,East Patrol Division
Training Bureau,TB,Personnel Command
Transit Service Bureau,TSB,Special Operations Division
TRAP,TRAP,Detective Division
Twin Towers,TTCF,Custody Services Division - Specialized Programs
Walnut/Diamond Bar Station,WAL,East Patrol Division
West Hollywood Station,WHD,North Patrol Division`;

interface UnitRow {
  'Unit of Assigment': string;
  'Overtime ID': string;
  Division: string;
}

export function parseCsvString(csv: string): UnitRow[] {
  const lines = csv.trim().split('\n');

  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] ?? '';
    });
    return obj as UnitRow;
  });
}

export function getUniqueDivisionNames(data: any[]): string[] {
  const divisions = new Set<string>();
  for (const row of data) {
    if (row.Division) {
      divisions.add(row.Division.trim());
    }
  }
  return Array.from(divisions);
}

export async function uploadDivisionsToMongo(
  divisions: string[],
  collection: Collection
): Promise<Map<string, ObjectId>> {
  const divisionMap = new Map<string, ObjectId>();

  for (const name of divisions) {
    const existing = await collection.findOne({ name });
    if (existing) {
      divisionMap.set(name, existing._id);
    } else {
      const result = await collection.insertOne({
        name,
        active: true,
        orgId,
        createdAt: new Date(),
        updatedAt: new Date(),
        modifiedById: createdById,
        createdById: createdById,
        docType: 'DIVISION',
      });
      divisionMap.set(name, result.insertedId);
    }
  }

  return divisionMap;
}

export function generateUnitObjects(
  data: UnitRow[],
  divisionIdMap: Map<string, ObjectId>
) {
  return data.map((row) => {
    const name = row['Unit of Assigment'].trim();
    const overtimeCode = row['Overtime ID'].trim();
    const divisionName = row.Division.trim();
    const divisionId = divisionIdMap.get(divisionName);

    return {
      name,
      active: true,
      overtimeCode,
      divisionIds: divisionId ? [divisionId] : [],
      orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
      modifiedById: createdById,
      createdById: createdById,
      docType: 'UNIT',
    };
  });
}

export const importUnitsAndDivisions = async (db: Db) => {
  const unitsCollection = db.collection('units');
  const divisionsCollection = db.collection('divisions');
  try {
    const data = parseCsvString(rawData);
    const uniqueDivisions = getUniqueDivisionNames(data);
    const divisionMap = await uploadDivisionsToMongo(uniqueDivisions, divisionsCollection);
    const unitData = generateUnitObjects(data, divisionMap);
    await unitsCollection.insertMany(unitData);
    console.log(`Successfully imported ${unitData.length} units and ${uniqueDivisions.length} divisions.`);
  } catch(error) {
    console.error('Failed to import units and divisions: ', error);
  }
}
