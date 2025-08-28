import { Db, ObjectId } from 'mongodb';
import { DocType, DocusignEvent, IncidentForm } from '../__generated__/resolvers-types';
import { BaseMongo } from './base.v2';

export interface InputIncidentForm extends Omit<
  IncidentForm,
  'id' |
  'eventId' |
  'modifiedById' |
  '__typename'
> {
  id?: string;
  _id?: ObjectId;
  eventId: ObjectId;
  userId: ObjectId;
  orgId: ObjectId;
  modifiedById: ObjectId;
}

export interface IIncidentForm extends Omit<
  IncidentForm,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'userId' |
  'user' |
  'orgId' |
  'org' |
  'eventId' |
  'event' |
  'modifiedById' |
  'modifiedBy' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  orgId: ObjectId;
  userId: ObjectId;
  eventId: ObjectId;
  modifiedById: ObjectId;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
}

export class IncidentSubmissionModel extends BaseMongo<IIncidentForm> {
  constructor(db: Db) {
    super(db, DocType.IncidentForm, 'incidentSubmissions');
  }

  findByIdAndOrgId(_id: ObjectId, orgId: ObjectId) {
    return this.collection.findOne<IIncidentForm>({
      _id,
      orgId,
    }).then((doc) => doc ? { ...doc, id: doc._id!.toHexString() } : null);
  }

  saveEnvelopeId(_id: ObjectId, envelopeId: string, pastEnvelopeId?: string) {
    return this.collection.updateOne(
      { _id },
      {
        $set: { envelopeId, updatedAt: new Date() },
        ...(pastEnvelopeId ? { $addToSet: { pastEnvelopeIds: pastEnvelopeId } } : {}),
      },
    );
  }

  findExistingByEventId(userId: ObjectId, eventId: ObjectId, submissionDate: Date) {
    return this.collection.aggregate<IIncidentForm>([
      {
        $match: {
          userId,
          eventId,
          'operationalPeriod.date': submissionDate,
          envelopeId: { $exists: true },
        }
      },
      {
        $lookup: {
          from: 'dsEvents',
          localField: 'envelopeId',
          foreignField: 'envelopeId',
          as: 'docusignEvent',
        },
      },
    ]).toArray().then((docs) => {
      if (!docs || docs.length === 0) {
        return null;
      }
      const doc = docs[0]!;
      return {
        ...doc,
        docusignEvent: doc?.docusignEvent?.[0] as DocusignEvent,
      };
    });
  }

  findByEnvelopeId(envelopeId: string) {
    return this.collection.findOne<IIncidentForm>({
      $or: [
        { envelopeId },
        { pastEnvelopeIds: envelopeId },
      ],
    }).then((doc) => doc ? { ...doc, id: doc._id!.toHexString() } : null);
  }

  findUserSubmission(userId: ObjectId, id: ObjectId) {
    return this.collection.findOne<IIncidentForm>({
      _id: id,
      userId,
    }).then((doc) => doc ? { ...doc, id: doc._id!.toHexString() } : null);
  }
};
