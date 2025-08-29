import { Collection, Db, ObjectId } from "mongodb";

export interface ActionDoc {
  userId: ObjectId
  eventId: ObjectId
  shiftGroupId?: string
  incidentFormId?: ObjectId
  actionType: string
  source: string
  modifiedById: ObjectId
  timestamp: Date
  action: string
  notes?: any
  actionId?: any
  docType: 'EVENT_USER_ACTION'
  createdAt: Date
  updatedAt: Date
};

export interface Shift {
  _id: ObjectId
  eventId: ObjectId
  shiftId: string
  userId: ObjectId
  orgId: ObjectId
  status: string
  modifiedById: ObjectId
  createdById: ObjectId
  createdAt: Date
  updatedAt: Date
  relinquishNote?: string
  docusignEvent: DocusignEvent[]
  shiftCheckInOut?: ShiftCheckInOut
};
export interface ShiftCheckInOut {
  checkInTime: Date
  checkOutTime: Date
  noShow: boolean
};
export interface ShiftInterestRequest {
  _id: ObjectId
  eventId: ObjectId
  shiftGroupId: string
  userId: ObjectId
  orgId: ObjectId
  status: string
  modifiedById: ObjectId
  createdById: ObjectId
  createdAt: Date
  updatedAt: Date
};
export interface IncidentForm {
  _id: ObjectId
  eventId: ObjectId
  modifiedById: ObjectId
  userId: ObjectId
  orgId: ObjectId
  submittedDate: Date
  createdById: Date
  createdAt: Date
  updatedAt: Date
  envelopeId: string
  docusignEvent: DocusignEvent[]
}
export interface DocusignEvent {
  _id: ObjectId
  envelopeId: string
  createdAt: Date
  eventId: Date
  orgId: Date
  signerDetails: any[]
  status: string
  updatedAt: Date
  userId: ObjectId
}

const incidentFormPipeline = [
  {
    $match: {
      envelopeId: {
        $exists: true
      }
    }
  },
  {
    $lookup: {
      from: "dsEvents",
      localField: "envelopeId",
      foreignField: "envelopeId",
      as: "docusignEvent"
    }
  }
];

const shiftPipeline = [
  {
    $match: {
      orgId: new ObjectId(
        "67c78e42035889550ba0baca"
      ),
      userId: {$exists: true},
      status: { $in: ['ASSIGNED', 'RELINQUISHED', 'UNASSIGNED'] }
    }
  },
  {
    $lookup: {
      from: "dsEvents",
      localField: "docusignEnvelopeId",
      foreignField: "envelopeId",
      as: "docusignEvent"
    }
  }
]

const migrateIncidentForms = async (dry: boolean, collection: Collection, activityCollection: Collection) => {
  let bulkInserts: ActionDoc[] = []

  const submitDocs = async (force: boolean = false) => {
    if (force || bulkInserts.length >= 1000) {
      if (bulkInserts.length > 0) {
        console.log('Submitting incident form updates...', bulkInserts.length);
        if (!dry) {
          await activityCollection.insertMany(bulkInserts);
        }
        bulkInserts = [];
      }
    }
  }

  for await (const doc of collection.aggregate<IncidentForm>(incidentFormPipeline)) {
    bulkInserts.push({
      userId: doc.userId,
      eventId: doc.eventId,
      incidentFormId: doc._id,
      actionType: 'INCIDENT_SUBMISSION',
      source: 'INCIDENT_SUBMISSION',
      modifiedById: doc.modifiedById,
      timestamp: doc.submittedDate || new Date(),
      action: 'DRAFTED',
      docType: 'EVENT_USER_ACTION',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const dsEvent = doc.docusignEvent?.[0];
    if (dsEvent) {
      bulkInserts.push({
        userId: doc.userId,
        eventId: doc.eventId,
        incidentFormId: doc._id,
        actionType: 'INCIDENT_SUBMISSION',
        source: 'DOCUSIGN',
        modifiedById: doc.modifiedById,
        timestamp: dsEvent.createdAt,
        action: 'SUBMITTED',
        actionId: dsEvent.envelopeId,
        docType: 'EVENT_USER_ACTION',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (dsEvent.status === 'completed') {
        bulkInserts.push({
          userId: doc.userId,
          eventId: doc.eventId,
          incidentFormId: doc._id,
          actionType: 'INCIDENT_SUBMISSION',
          source: 'DOCUSIGN',
          modifiedById: doc.modifiedById,
          timestamp: dsEvent.updatedAt,
          action: 'COMPLETED',
          actionId: dsEvent.envelopeId,
          docType: 'EVENT_USER_ACTION',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await submitDocs();
  };

  await submitDocs(true);
};

const migrateInterestRequests = async (dry: boolean, collection: Collection, activityCollection: Collection) => {
let bulkInserts: ActionDoc[] = []

  const submitDocs = async (force: boolean = false) => {
    if (force || bulkInserts.length >= 1000) {
      if (bulkInserts.length > 0) {
        console.log('Submitting interest request updates...', bulkInserts.length);
        if (!dry) {
          await activityCollection.insertMany(bulkInserts);
        }
        bulkInserts = [];
      }
    }
  }

  for await (const doc of collection.find<ShiftInterestRequest>({})) {
    bulkInserts.push({
      userId: doc.userId,
      eventId: doc.eventId,
      shiftGroupId: doc.shiftGroupId,
      actionType: 'SHIFT',
      source: 'INTEREST_REQUEST',
      modifiedById: doc.modifiedById,
      timestamp: doc.createdAt,
      action: 'SUBMITTED',
      docType: 'EVENT_USER_ACTION',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (doc.status !== 'PENDING') {
      bulkInserts.push({
        userId: doc.userId,
        eventId: doc.eventId,
        shiftGroupId: doc.shiftGroupId,
        actionType: 'SHIFT',
        source: 'INTEREST_REQUEST',
        modifiedById: doc.modifiedById,
        timestamp: doc.updatedAt,
        action: doc.status,
        docType: 'EVENT_USER_ACTION',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await submitDocs();
  }
  await submitDocs(true);
};

const migrateShiftEvents = async (dry: boolean, collection: Collection, activityCollection: Collection) => {
  let bulkInserts: ActionDoc[] = []

  const submitDocs = async (force: boolean = false) => {
    if (force || bulkInserts.length >= 1000) {
      if (bulkInserts.length > 0) {
        console.log('Submitting shift updates...', bulkInserts.length);
        if (!dry) {
          await activityCollection.insertMany(bulkInserts);
        }
        bulkInserts = [];
      }
    }
  }

  for await (const doc of collection.aggregate<Shift>(shiftPipeline)) {
    if (!['ASSIGNED', 'RELINQUISHED', 'UNASSIGNED'].includes(doc.status)) {
      continue;
    }
    bulkInserts.push({
      userId: doc.userId,
      eventId: doc.eventId,
      shiftGroupId: doc.shiftId,
      actionType: 'SHIFT',
      source: 'SHIFT',
      modifiedById: doc.modifiedById,
      timestamp: doc.updatedAt || new Date(),
      action: doc.status,
      notes: doc.status !== 'ASSIGNED' ? doc.relinquishNote : undefined,
      docType: 'EVENT_USER_ACTION',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (doc.shiftCheckInOut?.checkInTime) {
      bulkInserts.push({
        userId: doc.userId,
        eventId: doc.eventId,
        shiftGroupId: doc.shiftId,
        actionType: 'SHIFT',
        source: 'SHIFT',
        modifiedById: doc.modifiedById,
        timestamp: doc.shiftCheckInOut.checkInTime,
        action: 'CHECK_IN',
        docType: 'EVENT_USER_ACTION',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (doc.shiftCheckInOut?.checkOutTime) {
      bulkInserts.push({
        userId: doc.userId,
        eventId: doc.eventId,
        shiftGroupId: doc.shiftId,
        actionType: 'SHIFT',
        source: 'SHIFT',
        modifiedById: doc.modifiedById,
        timestamp: doc.shiftCheckInOut.checkOutTime,
        action: 'CHECK_OUT',
        docType: 'EVENT_USER_ACTION',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const dsEvent = doc.docusignEvent?.[0];
    if (dsEvent) {
      bulkInserts.push({
        userId: doc.userId,
        eventId: doc.eventId,
        shiftGroupId: doc.shiftId,
        actionType: 'SHIFT',
        source: 'DOCUSIGN',
        modifiedById: doc.modifiedById,
        timestamp: dsEvent.createdAt,
        action: 'SUBMITTED',
        docType: 'EVENT_USER_ACTION',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (dsEvent.status === 'completed') {
        bulkInserts.push({
          userId: doc.userId,
          eventId: doc.eventId,
          shiftGroupId: doc.shiftId,
          actionType: 'SHIFT',
          source: 'DOCUSIGN',
          modifiedById: doc.modifiedById,
          timestamp: dsEvent.updatedAt,
          action: 'COMPLETED',
          docType: 'EVENT_USER_ACTION',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await submitDocs();
  };

  await submitDocs(true);
}

export const activityMigrations = async (prodDb: Db) => {
  const dry = false;
  // incident form migration
  const incidentForms = prodDb.collection('incidentSubmissions');
  const activityCollection = prodDb.collection('eventUserActions');
  const interestRequests = prodDb.collection('shiftInterestRequests');
  const shifts = prodDb.collection('shifts');

  await migrateIncidentForms(dry, incidentForms, activityCollection);
  await migrateInterestRequests(dry, interestRequests, activityCollection);
  await migrateShiftEvents(dry, shifts, activityCollection);
};
