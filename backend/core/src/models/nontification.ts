import { Db } from 'mongodb';
import { PinpointClient } from "@aws-sdk/client-pinpoint";
import { Notification, DocType } from '../__generated__/resolvers-types';
import { BaseModel } from './base';

const pinpoint = new PinpointClient({});

// TODO: Add pinpoint integration :)
export class NotificationModel extends BaseModel<Notification> {
  constructor(db: Db) {
    super(db, DocType.Notification, 'notifications');
  }
};
