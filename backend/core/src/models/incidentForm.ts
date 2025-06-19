import { Db, ObjectId } from 'mongodb';
import { DocType, IncidentForm } from '../__generated__/resolvers-types';
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

  saveEnvelopeId(_id: ObjectId, envelopeId: string) {
    return this.collection.updateOne(
      { _id },
      { $set: { envelopeId, updatedAt: new Date() } },
    );
  }

  findExistingByEventId(userId: ObjectId, eventId: ObjectId, submissionDate: Date) {
    return this.collection.findOne({
      userId,
      eventId,
      'operationalPeriod.date': submissionDate,
      envelopeId: { $exists: true },
    });
  }

  findByEnvelopeId(envelopeId: string) {
    return this.collection.findOne<IIncidentForm>({
      envelopeId,
    }).then((doc) => doc ? { ...doc, id: doc._id!.toHexString() } : null);
  }
};
