import { Db } from 'mongodb';
import { Notification, DocType } from '../__generated__/resolvers-types';
import { BaseModel } from './base';

export class NotificationModel extends BaseModel<Notification> {
  constructor(db: Db) {
    super(db, DocType.Notification, 'notifications');
  }
};
