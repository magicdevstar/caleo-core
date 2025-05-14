import startOfDay from "date-fns/startOfDay";
import { EventModel } from "../models/event";
import logger from "../utils/logger";
import { EventStatus } from "../__generated__/resolvers-types";
import { AssignmentModel } from "../models/assignment";
import { IChangeData, IChangeStreamEvent } from "../types/change.streams";
import { NotificationService } from "./notification.service";
import { ChangesModel, ChangeType } from "../models/changes";
import { ObjectId } from "mongodb";
import subDays from "date-fns/subDays";
import { IEventUpdates } from "../types/notifications";

export class ChangeStreamService {
  constructor(
    private events: EventModel,
    private assignments: AssignmentModel,
    private notifications: NotificationService,
    private changes: ChangesModel,
  ) {}

  private getUpdates({
    interestedFields,
    updatedFields,
    fullDocumentBeforeChange,
  }: {
    interestedFields: string[],
    updatedFields: Record<string, any>,
    fullDocumentBeforeChange: Record<string, any>,
  }) {
    const changes = interestedFields.reduce((acc, field) => {
      if (updatedFields[field]) {
        acc[field] = {
          oldValue: fullDocumentBeforeChange[field],
          newValue: updatedFields[field],
        };
      }
      return acc;
    }, {} as Record<string, IChangeData>);
    return changes;
  }

  async handleShift({
    shiftId,
    orgId,
    startTime,
    endTime,
  }: {
    shiftId: string,
    orgId: ObjectId,
    startTime?: IChangeData,
    endTime?: IChangeData,
  }) {
    const changes: Record<string, IChangeData> = {};
    if (startTime) {
      changes.startTime = startTime;
    }
    if (endTime) {
      changes.endTime = endTime;
    }

    if (Object.keys(changes).length === 0) {
      logger.info('No changes to notify for shift');
      return;
    }

    // Save changes to the database
    const day = startOfDay(new Date());
    await this.changes.upsertForDay({
      type: ChangeType.SHIFT,
      orgId,
      entityId: shiftId,
      changeDate: day,
      changes,
    });
  }

  async handleEvent(event: IChangeStreamEvent) {
    const e = await this.events.get(event.detail.documentKey._id);
    if (!e) {
      logger.info('Event not found', { eventId: event.detail.documentKey._id });
      return;
    }

    // We don't need to notify for these event statuses so we ignore them here
    if ([
      EventStatus.Complete,
      EventStatus.Draft,
      EventStatus.Removed,
      EventStatus.Requested,
      EventStatus.Template,
    ].includes(e.status)) {
      return;
    }

    const interestedFields = [
      'name',
      'venueId',
      'startTime',
      'endTime',
      'notes',
    ];
    const changes = this.getUpdates({
      interestedFields,
      updatedFields: event.detail.updateDescription.updatedFields,
      fullDocumentBeforeChange: event.detail.fullDocumentBeforeChange,
    });

    if (Object.keys(changes).length === 0) {
      logger.info('No changes to notify', { eventId: event.detail.documentKey._id });
      return;
    }

    // Save changes to the database
    const day = startOfDay(new Date(event.detail.wallTime));
    await this.changes.upsertForDay({
      type: ChangeType.EVENT,
      orgId: e.orgId,
      entityId: new ObjectId(event.detail.documentKey._id),
      changeDate: day,
      changes,
    });
  }

  async handleAssignment(event: IChangeStreamEvent) {
    const assignment = await this.assignments.get(event.detail.documentKey._id);
    if (!assignment) {
      logger.info('Assignment not found', { assignmentId: event.detail.documentKey._id });
      return;
    }

    const e = await this.events.get(assignment.eventId);
    if (!e) {
      logger.info('Event not found', { eventId: event.detail.documentKey._id });
      return;
    }

    // Fetch number of shifts for the assignment

    // We don't need to notify for these event statuses so we ignore them here
    if ([
      EventStatus.Complete,
      EventStatus.Draft,
      EventStatus.Removed,
      EventStatus.Requested,
      EventStatus.Template,
    ].includes(e.status)) {
      return;
    }

    const interestedFields = [
      'name',
      'description',
      'bwNeeded',
      'requiredSkillIds',
      'requiredEquipmentIds',
      'shiftIds',
    ];

    const changes = this.getUpdates({
      interestedFields,
      updatedFields: event.detail.updateDescription.updatedFields,
      fullDocumentBeforeChange: event.detail.fullDocumentBeforeChange,
    });

    if (Object.keys(changes).length === 0) {
      logger.info('No changes to notify', { eventId: event.detail.documentKey._id });
      return;
    }

    // Save changes to the database
    const day = startOfDay(new Date(event.detail.wallTime));
    await this.changes.upsertForDay({
      type: ChangeType.ASSIGNMENT,
      orgId: e.orgId,
      entityId: new ObjectId(event.detail.documentKey._id),
      changeDate: day,
      changes,
    });
  }

  async sendDailyChangeNotifications() {
    const yesterday = subDays(startOfDay(new Date()), 1);

    const yesterdaysChanges = await this.changes.collection.find({
      changeDate: yesterday,
    }).toArray();

    for (const change of yesterdaysChanges) {
      switch(change.type) {
        case ChangeType.EVENT:
          await this.notifications.eventChange({
            eventId: change.entityId as ObjectId,
            orgId: change.orgId,
            updates: change.changes as IEventUpdates,
          });
          break;
        case ChangeType.ASSIGNMENT:
          await this.notifications.assignmentChange({
            assignmentId: change.entityId as ObjectId,
            orgId: change.orgId,
            updates: change.changes as IEventUpdates,
          });
          break;
        case ChangeType.SHIFT:
          await this.notifications.shiftChange({
            shiftId: change.entityId as string,
            orgId: change.orgId,
            updates: change.changes,
          });
          break;
        default:
          logger.info('Change type not supported for notifications', { type: change.type });
          break;
      }
    }

  }
};
