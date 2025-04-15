import { ObjectId } from "mongodb";
import { utcToZonedTime } from "date-fns-tz";
import { format, isAfter, subHours } from "date-fns";
import { InvocationType, InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

import { EventStatus } from "../__generated__/resolvers-types";
import { EventModel, IEvent } from "../models/event";
import { ScheduleEvent, SchedulerModel, Timezone } from "../models/scheduler";
import { IOrganization } from "../models/organization";
import { IShift } from "../models/shift";
import logger from "../utils/logger";
import { ShiftInterestRequestModel } from "../models/shiftInterestRequest";

const lambda = new LambdaClient();

export class InterestListService {
  constructor(
    private shiftInterestRequests: ShiftInterestRequestModel,
    private events: EventModel,
    private scheduler: SchedulerModel,
  ) {}

  async maybeTriggerNextAssignment({
    shift,
    organization,
    relinquishId,
  }: {
    shift: IShift;
    relinquishId?: ObjectId;
    organization: IOrganization;
  }) {
    // Do nothing if this feature is not enabled for the organization
    if (!organization.features.interestLists) {
      return;
    }

    if (relinquishId) {
      await this.shiftInterestRequests.collection.updateMany({
        assignedShiftId: shift._id,
      }, {
        $set: {
          assignedShiftId: relinquishId,
          updatedAt: new Date(),
        },
      });
    }

    const event = await this.events.get(shift.eventId);
    if (!event) {
      logger.error('Event not found', { shift, organization });
      return;
    }
    if (event.status !== EventStatus.InterestList || !event.scheduledCloseInterestList) {
      return;
    }

    const interestListClose = utcToZonedTime(new Date(event.scheduledCloseInterestList), organization?.timezone || 'America/Los_Angeles' as any);
    const now = utcToZonedTime(new Date(), organization?.timezone || 'America/Los_Angeles' as any);
    
    if (isAfter(now, interestListClose) && !shift.locked) {
      try {
        await lambda.send(new InvokeCommand({
          FunctionName: `caleo-core-${process.env.STAGE}-assignShiftGroup`,
          InvocationType: InvocationType.Event,
          Payload: JSON.stringify({
            orgId: organization.id,
            _id: shift.shiftId,
          }),
        }));
      } catch (error) {
        logger.error(error);
      }
    }
  }

  removeInterest({
    userId,
    shiftGroupId,
    orgId,
  } : {
    userId: ObjectId,
    shiftGroupId: string,
    orgId: ObjectId,
  }) {
    return this.shiftInterestRequests.collection.deleteOne({
      userId,
      orgId,
      shiftGroupId,
    });
  }

  async registerEventHooks({
    event,
    organization,
    beforeEvent,
  } : {
    beforeEvent?: IEvent,
    event: IEvent,
    organization: IOrganization
  }) {
    // Do nothing if this feature is not enabled for the organization
    if (!organization.features.interestLists) {
      return;
    }
    // Do nothing if the event status before was not interest list and the
    // new event status is also not interest list
    if (
      beforeEvent &&
      beforeEvent.status !== EventStatus.InterestList &&
      event.status !== EventStatus.InterestList
    ) {
      return;
    }

    const orgId = event.orgId;
    const closingEvents = subHours(
      event.scheduledCloseInterestList || new Date(),
      organization.settings?.interestList?.defaultNotificationTime || 24
    );
    const events = [
      {
        event: ScheduleEvent.EVENT_INTEREST_GO_LIVE,
        orgId,
        customEventName: `${ScheduleEvent.EVENT_INTEREST_GO_LIVE}-${event?.id}`,
        eventTime: `at(${format(event.scheduledInterestList || new Date(), 'yyyy-MM-dd&&HH:mm:ss').replace('&&','T')})`,
        eventTimeZone: Timezone.UTC,
        input: {
          orgId: orgId.toString(),
          eventId: event.id,
        },
      },
      {
        event: ScheduleEvent.EVENT_INTEREST_CLOSE,
        orgId,
        customEventName: `${ScheduleEvent.EVENT_INTEREST_CLOSE}-${event?.id}`,
        eventTime: `at(${format(event.scheduledCloseInterestList || new Date(), 'yyyy-MM-dd&&HH:mm:ss').replace('&&','T')})`,
        eventTimeZone: Timezone.UTC,
        input: {
          orgId: orgId.toString(),
          eventId: event.id,
          transition: event.interestListTransition,
        },
      },
      {
        event: ScheduleEvent.EVENT_INTEREST_CLOSING,
        orgId,
        customEventName: `${ScheduleEvent.EVENT_INTEREST_CLOSING}-${event?.id}`,
        eventTime: `at(${format(closingEvents, 'yyyy-MM-dd&&HH:mm:ss').replace('&&','T')})`,
        eventTimeZone: Timezone.UTC,
        input: {
          orgId: orgId.toString(),
          eventId: event.id,
          transition: event.interestListTransition,
        },
      }
    ];

    if (event.status !== EventStatus.InterestList) {
      return Promise.allSettled(
        events.map((e) => this.scheduler.removeSchedule({
          event: e.event,
          orgId,
          customEventName: e.customEventName,
          ignoreError: true,
        }))
      );
    }

    // Schedule events or don't depending if we have
    // already scheduled them or not
    return Promise.allSettled(
      events.map((e) => this.scheduler.updateScheduledEvent({
        event: e.event,
        orgId,
        eventTime: e.eventTime,
        eventTimeZone: e.eventTimeZone,
        customEventName: e.customEventName,
        eventInput: {
          action: e.event,
          ...e.input
        },
      }))
    );
  }
}