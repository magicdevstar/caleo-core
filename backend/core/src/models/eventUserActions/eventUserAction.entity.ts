import { ObjectId } from 'mongodb';
import { EventUserAction } from '../../__generated__/resolvers-types';

export interface IEventUserAction extends Omit<
  EventUserAction,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'removedAt' |
  'userId' |
  'user' |
  'eventId' |
  'event' |
  'incidentFormId' |
  'shifts' |
  'shiftInterestRequests' |
  'shiftLotteryRequests' |
  'incidentForm' |
  'modifiedById' |
  'modifiedBy' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  userId: ObjectId;
  eventId: ObjectId;
  incidentFormId?: ObjectId;
  modifiedById?: ObjectId;

  createdAt: Date;
  updatedAt: Date;
  removedAt?: Date;
};
