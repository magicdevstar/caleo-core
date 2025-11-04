import { ObjectId } from 'mongodb';
import { EventNotification } from '../../__generated__/resolvers-types';

export interface IEventNotification extends Omit<
  EventNotification,
  'id' |
  'eventId' |
  'assignmentId' |
  'shiftId' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'orgId' |
  'org' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;

  eventId?: ObjectId;
  assignmentId?: ObjectId;
  shiftId?: ObjectId;

  orgId: ObjectId;
  modifiedById: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
};
