import { randomUUID as uuid } from 'crypto';
import { Db, ObjectId, PushOperator } from 'mongodb';
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import {
  DocType,
  Event,
  EventAttachmentUpload,
  EventRequestDetails,
  EventStatus,
  Organization,
  UpsertEvent,
} from '../__generated__/resolvers-types';
import { DocumentModel } from './document';
import { ShiftModel } from './shift';
import { Action, MailerEvent, MailerEvents } from '../types/mailer';
import { BaseMongo } from './base.v2';
import { IOrganization } from './organizations/organization.entity';
import { toZonedTime } from 'date-fns-tz';
import { addMonths, isBefore } from 'date-fns';
import { GraphQLError } from 'graphql';
import { IUser } from '../types/common';

const lambda = new LambdaClient({});

export interface IEventRequestDetails extends Omit<
  EventRequestDetails,
  'startTime' |
  'endTime'
> {
  startTime?: Date;
  endTime?: Date;
}

export interface IEvent extends Omit<
  Event,
  'id' |
  'createdAt' |
  'updatedAt' |
  'removedAt' |
  'modifiedById' |
  'modifiedBy' |
  'orgId' |
  'org' |
  'startTime' |
  'endTime' |
  'scheduledInterestList' |
  'scheduledCloseInterestList' |
  'scheduledFirstComeFirstServe' |
  'interestListAutoAssignCutoff' |
  'venueId' |
  'venue' |
  'assignmentIds' |
  'assignments' |
  'createdById' |
  'createdBy' |
  'requestDetails' |
  'referenceId' |
  'supervisorId' |
  'lieutenantId' |
  '__typename'
> {
  _id?: ObjectId;
  id?: string;
  orgId: ObjectId;
  modifiedById: ObjectId;
  venueId?: ObjectId;
  assignmentIds?: ObjectId[];
  createdById?: ObjectId;

  supervisorId?: ObjectId;
  lieutenantId?: ObjectId;

  requestDetails?: IEventRequestDetails;
  referenceId?: number;

  startTime?: Date;
  endTime?: Date;
  scheduledInterestList?: Date;
  scheduledCloseInterestList?: Date;
  scheduledFirstComeFirstServe?: Date;
  interestListAutoAssignCutoff?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  removedAt?: Date;
  lastDepartmentNotificationDate?: Date;
}

export interface IUpsertEvent extends Omit<UpsertEvent, 'createdById'> {
  referenceId?: number;
  createdById?: ObjectId;
}

export enum EventRemoveEventType {
  assignment,
  shift,
  shifts,
  shiftUpdate,
}

export class EventModel extends BaseMongo<IEvent> {
  documentBasePath: string = 'events';
  constructor(
    db: Db,
    private document: DocumentModel,
    private shifts: ShiftModel,
  ) {
    super(db, DocType.Event, 'events');
  }

  async cloneEvent({
    id,
    user,
    organization,
    getRefNumber,
    status = EventStatus.Draft,
  } : {
    id: string;
    user: IUser;
    organization: IOrganization;
    getRefNumber: (id: string) => Promise<number>;
    status?: EventStatus;
  }) {
    const templateEvent = await this.collection.findOne<IEvent>({
      _id: new ObjectId(id),
      orgId: organization._id,
    });
    if (!templateEvent) {
      throw new GraphQLError('Could not find event to clone');
    }

    delete templateEvent.id;
    delete templateEvent._id;
    delete templateEvent.startTime;
    delete templateEvent.endTime;
    delete templateEvent.scheduledFirstComeFirstServe;
    delete templateEvent.attachmentPaths;
    delete templateEvent.lotteryNumber;
    delete templateEvent.scheduledCloseInterestList;
    delete templateEvent.interestListTransition;
    delete templateEvent.autoAssignInterestList;
    delete templateEvent.scheduledFirstComeFirstServe;
    delete templateEvent.notifyOnFirstComeFirstServe;
    delete templateEvent.notifyWhenFullyStaffed;
    delete templateEvent.requestDetails;
    delete templateEvent.requestDetails;
    delete templateEvent.assignmentIds;
    delete templateEvent.docusignEnvelopeId;
    delete templateEvent.docusignEnvelopeStatus;
    templateEvent.status = status;
    templateEvent.createdById = user._id!;
    templateEvent.modifiedById = user._id!;
    templateEvent.referenceId = await getRefNumber(organization.id);

    return this.create(templateEvent);
  }

  async approveEvent(id: ObjectId, modifiedById: ObjectId) {
    await this.collection.updateOne({
      _id: id,
    }, {
      $set: {
        status: EventStatus.Draft,
        modifiedById,
        updatedAt: new Date(),
      },
    });
  }

  async removeEvent({
    event,
    organization,
    modifiedById,
  } : {
    event: IEvent;
    organization: IOrganization | Organization;
    modifiedById: ObjectId;
  }) {
    await this.remove(event.id!, {
      modifiedById: modifiedById,
      status: EventStatus.Removed,
    });

    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template: MailerEvents.OfficerEventRemoved,
        data: {
          event,
          organization,
          modifiedById,
        }
      } as MailerEvent),
    }));
  }

  async sendEventRequestMailerEvent({
    event,
    venueId,
    orgId,
    template
  } : {
    event: IEvent;
    venueId?: ObjectId;
    orgId: string;
    template: MailerEvents.EventRequestedApproved | MailerEvents.EventRequestedRejected | MailerEvents.EventRequestedConfirm | MailerEvents.AdminEventRequested;
  }) {
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MAILER_LAMBDA,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        action: Action.Email,
        template,
        data: {
          event,
          venueId,
          orgId,
        }
      } as MailerEvent),
    }));
  }

  async updateEvent({
    eventId,
    removeId,
    removeType,
    removeStart,
    removeEnd,
    orgId,
    modifiedById,
    lasdEventFields,
    timezone,
  }: {
    eventId: ObjectId;
    removeId: string;
    removeType: EventRemoveEventType;
    orgId: ObjectId;
    removeStart?: Date;
    removeEnd?: Date;
    modifiedById: ObjectId;
    lasdEventFields?: boolean;
    timezone?: string;
  }) {
    const event = await this.get(eventId);

    if (event) {
      if (
        removeStart &&
        removeEnd &&
        event.startTime?.getTime() !== removeStart.getTime() &&
        event.endTime?.getTime() !== removeEnd.getTime()
      ) {
        return false;
      }

      const shiftFilter: any = {
        orgId,
        eventId,
      };
  
      let pullAssignmentIds: any;
      if (removeType === EventRemoveEventType.assignment) {
        const removeIdAsObjectId = new ObjectId(removeId);
        shiftFilter.assignmentId = {$ne: removeIdAsObjectId};
        pullAssignmentIds = {
          assignmentIds: removeIdAsObjectId,
        };
      } else if (removeType === EventRemoveEventType.shift) {
        // TODO: Update this to objectId when you switch shifts to base v2
        shiftFilter.id = {$ne: removeId};
      } else if (removeType === EventRemoveEventType.shifts) {
        // TODO: Update this to objectId when you switch shifts to base v2
        shiftFilter.shiftId = {$ne: removeId};
      }
  
      const [earliestShift] = await this.shifts.collection
        .find({
          ...shiftFilter,
          removedAt: { $exists: false },
        })
        .sort('startTime', 'asc')
        .limit(1)
        .toArray();
  
      const [latestShift] = await this.shifts.collection
        .find({
          ...shiftFilter,
          removedAt: { $exists: false },
        })
        .sort('endTime', 'desc')
        .limit(1)
        .toArray();
  
      const startTime = earliestShift ? earliestShift.startTime : null;
      const endTime = latestShift ? latestShift.endTime : null;

      this.collection.updateOne({
        _id: event._id!,
      }, {
        $set: {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          modifiedById: modifiedById,
          updatedAt: new Date(),
        },
        ...(pullAssignmentIds && { $pull: pullAssignmentIds }),
      });

      if (
        lasdEventFields && timezone &&
        (!event.ocn || event.ocn.length !== 10) &&
        event.lastDepartmentNotificationDate === undefined &&
        isBefore(
          toZonedTime(new Date(startTime), timezone!),
          addMonths(toZonedTime(new Date(), timezone!), 1)
        )
      ) {
        // invoke mailer lambda
        await lambda.send(new InvokeCommand({
          FunctionName: process.env.MAILER_LAMBDA,
          InvocationType: 'Event',
          Payload: JSON.stringify({
            action: Action.Email,
            template: MailerEvents.MissingOCN,
            data: {
              eventIds: [eventId],
              orgId,
            }
          } as MailerEvent),
        }));
      }
    }
    return true;
  }

  async getUploadUrl({
    orgId,
  }: {
    orgId: ObjectId;
  }): Promise<EventAttachmentUpload> {
    const attachmentPath = `${orgId.toString()}/${this.documentBasePath}/${uuid()}`;
    const uploadUrl = await this.document.getUploadUrl(attachmentPath);
    return {
      attachmentPath,
      uploadUrl,
    };
  };

  async getDownloadUrl(attachmentPath: string) {
    return this.document.getDownloadUrl(attachmentPath);
  };

  async addAssignmentIds(
    id: ObjectId,
    assignmentIds: ObjectId[],
    modifiedById?: ObjectId,
  ) {
    await this.collection.updateOne({
      _id: id,
    }, {
      $set: {
        updatedAt: new Date(),
        modifiedById,
      },
      $push: {
        assignmentIds: {$each: assignmentIds},
      } as PushOperator<Document>,
    });
  }

  async transitionEvent({
    eventId,
    transition,
  } : {
    eventId: string;
    transition?: EventStatus;
  }) {
    if (!transition) {
      return;
    }

    await this.collection.updateOne({
      _id: new ObjectId(eventId),
    }, {
      $set: {
        status: transition,
        updatedAt: new Date(),
      },
    });
  }

  async setDocusignEnvelopeId(
    eventId: ObjectId,
    envelopeId: string,
  ) {
    await this.collection.updateOne({
      _id: eventId,
    }, {
      $set: {
        docusignEnvelopeId: envelopeId,
        updatedAt: new Date(),
      },
    });
  }

  getByEnvelopeId(envelopeId: string) {
    return this.collection.findOne<IEvent>({
      docusignEnvelopeId: envelopeId,
    });
  }

  async setDocusignStatus(eventId: ObjectId, status: string) {
    await this.collection.updateOne({
      _id: eventId,
    }, {
      $set: {
        docusignEnvelopeStatus: status,
      },
    });
  }
};
