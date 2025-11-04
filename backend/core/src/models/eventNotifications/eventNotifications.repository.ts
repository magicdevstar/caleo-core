import { Db, ObjectId } from 'mongodb';
import { randomUUID as uuid } from 'crypto';
import { EventAttachmentUpload } from '../../__generated__/resolvers-types';
import { BaseMongo } from './../base.v2';
import { DocumentModel } from './../document';
import { IEventNotification } from './eventNotifications.entity';

export class EventNotificationModel extends BaseMongo<IEventNotification> {
  constructor(db: Db, private document: DocumentModel) {
    super(db, 'eventNotifications' as any, 'eventNotifications');
  }

  async getUploadUrl({
    orgId,
  }: {
    orgId: ObjectId;
  }): Promise<EventAttachmentUpload> {
    const attachmentPath = `${orgId.toString()}/eventNotifications/${uuid()}`;
    const uploadUrl = await this.document.getUploadUrl(attachmentPath);
    return {
      attachmentPath,
      uploadUrl,
    };
  };
};
