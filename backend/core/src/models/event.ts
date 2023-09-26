import { Db } from 'mongodb';
import { v4 as uuid } from 'uuid';
import {
  DocType,
  Event,
  EventAttachmentUpload,
  EventStatus,
} from '../__generated__/resolvers-types';
import { BaseModel } from './base';
import { DocumentModel } from './document';
import { ShiftModel } from './shift';
import { ScheduleEvent, SchedulerModel } from './scheduler';
import { OrganizationModel } from './organization';

export enum EventRemoveEventType {
  assignment,
  shift,
  shifts,
  shiftUpdate,
}

export class EventModel extends BaseModel<Event> {
  documentBasePath: string = 'events';
  constructor(
    db: Db,
    private document: DocumentModel,
    private shifts: ShiftModel,
  ) {
    super(db, DocType.Event, 'events');
  }

  async updateEvent({
    eventId,
    removeId,
    removeType,
    removeStart,
    removeEnd,
    orgId,
  }: {
    eventId: string;
    removeId: string;
    removeType: EventRemoveEventType;
    orgId: string;
    removeStart?: number;
    removeEnd?: number;
  }) {
    const event = await this.get(eventId);

    if (event) {
      if (
        removeStart &&
        removeEnd &&
        (event.startTime as any) !== removeStart &&
        (event.endTime as any) !== removeEnd
      ) {
        return false;
      }

      const shiftFilter: any = {
        docType: DocType.Shift,
        orgId,
        eventId,
      };
  
      let eventUpdates: any = {};
      if (removeType === EventRemoveEventType.assignment) {
        shiftFilter.assignmentId = {$ne: removeId};
        eventUpdates = {
          assignmentIds: (event.assignmentIds || []).filter((aid) => aid !== removeId),
        };
      } else if (removeType === EventRemoveEventType.shift) {
        shiftFilter.id = {$ne: removeId};
      } else if (removeType === EventRemoveEventType.shifts) {
        shiftFilter.shiftId = {$ne: removeId};
      }
  
      const [earliestShift] = await this.shifts.collection
        .find(shiftFilter)
        .sort('startTime', 'asc')
        .limit(1)
        .toArray();
  
      const [latestShift] = await this.shifts.collection
        .find(shiftFilter)
        .sort('endTime', 'desc')
        .limit(1)
        .toArray();
  
      const startTime = earliestShift ? earliestShift.startTime : null;
      const endTime = latestShift ? latestShift.endTime : null;
      const totalShifts = await this.shifts.collection.countDocuments(shiftFilter);

      if (event.status === EventStatus.Draft && totalShifts > 0) {
        event.status = EventStatus.ReadyForLottery;
      } 

      await this.update({
        ...event,
        ...eventUpdates,
        startTime,
        endTime,
        status: totalShifts === 0 ? EventStatus.Draft : event.status,
      } as any, { skipMerge: true });
    }
    return true;
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
