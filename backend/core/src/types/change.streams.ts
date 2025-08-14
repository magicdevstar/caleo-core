export interface IChangeStreamEvent {
  version: string
  id: string
  "detail-type": string
  source: string
  account: string
  time: string
  region: string
  resources: string[]
  detail: IDetail
}

export interface IDetail {
  _id: Id
  operationType: string
  clusterTime: IClusterTime
  wallTime: string
  ns: INS
  documentKey: IDocumentKey
  updateDescription: IUpdateDescription,
  fullDocumentBeforeChange: Record<string, unknown>;
}

export interface IChangeData {
  oldValue: string | number | boolean | Date | null | Array<any>;
  newValue: string | number | boolean | Date | null | Array<any>;
}

export interface Id {
  _data: string
}

export interface IClusterTime {
  T: number
  I: number
}

export enum ChangeStreamCollection {
  EVENTS = 'events',
  ASSIGNMENTS = 'assignments',
  SHIFTS = 'shifts',
  SHIFT_INTEREST_REQUESTS = 'shiftInterestRequests',
  SHIFT_LOTTERY_REQUESTS = 'shiftLotteryRequests',
  INCIDENT_SUBMISSIONS = 'incidentSubmissions',
}

export interface INS {
  db: string;
  coll: ChangeStreamCollection;
}

export interface IDocumentKey {
  _id: string
}

export interface IUpdateDescription {
  updatedFields: Record<string, any>
  removedFields: any[]
  truncatedArrays: any[]
}
