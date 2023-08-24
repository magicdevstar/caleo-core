import { Db } from 'mongodb';
import { v4 as uuid } from 'uuid';
import {
  DocType,
  Event,
  EventAttachmentUpload,
} from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import { DocumentModel } from './document';

export class EventModel extends BaseModel<Event> {
  document: DocumentModel;
  documentBasePath: string = 'events';
  constructor(db: Db) {
    super(db, DocType.Event);
    this.document = new DocumentModel();
  }

  async getUploadUrl({
    orgId,
  }: {
    orgId: string;
  }): Promise<EventAttachmentUpload> {
    const attachmentPath = `${orgId}/${this.documentBasePath}/${uuid()}`;
    const uploadUrl = await this.document.getUploadUrl(attachmentPath);
    return {
      attachmentPath,
      uploadUrl,
    };
  };

  async getDownloadUrl(attachmentPath: string) {
    return this.document.getDownloadUrl(attachmentPath);
  }
};
