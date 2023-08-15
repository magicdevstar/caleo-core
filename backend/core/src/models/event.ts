import { Db } from 'mongodb';
import { DocType, Event } from '../__generated__/resolvers-types';
import { BaseModel } from './base';

export class EventModel extends BaseModel<Event> {
  constructor(db: Db) {
    super(db, DocType.Event);
  }
};
