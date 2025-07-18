import { GraphQLError } from "graphql";
import { Context } from "../../../utils/createContext";
import {
  EventStatus,
  EventAttachmentUpload,
  VenueStatus,
  DocType,
  EventInvoiceResponse
} from "../../../__generated__/resolvers-types";
import { adminOnly } from "../../../utils/access";
import logger from "../../../utils/logger";
import { format, addMinutes, isAfter } from "date-fns";
import { ScheduleEvent, Timezone } from "../../../models/scheduler";
import { MailerEvents } from "../../../types/mailer";
import { IEvent, IUpsertEvent } from "../../../models/event";
import { ObjectId } from "mongodb";
import { truncateToMinute } from "../../../utils/date.helpers";

export const Mutation = {
  generateInvoice: async (
    _parent: unknown,
    { eventId }: { eventId: string },
    { docusign, user, organization }: Context
  ): Promise<string> => {
    adminOnly(user);
    const invoice = await docusign.createInvoiceHTML({
      eventId: new ObjectId(eventId),
      organization: organization!,
    })
    return invoice;
  },
  generateDSInvoice: async (
    _parent: unknown,
    { eventId }: { eventId: string },
    { docusign, user, organization }: Context
  ): Promise<EventInvoiceResponse> => {
    adminOnly(user);
    const signingUrl = await docusign.submitEventInvoice({
      eventId: new ObjectId(eventId),
      user: user!,
      organization: organization!,
    })
    return {
      signingUrl: signingUrl || '',
    };
  },
  notifyUsersOfEvent: async (
    _parent: unknown,
    { eventId }: { eventId: string },
    {
      shifts,
      user,
      organization,
    }: Context
  ): Promise<boolean> => {
    adminOnly(user);
    await shifts.notifyUsersOfEventAvailability(eventId, organization!);
    return true;
  },
  eventAttachmentUploadUrl: async (
    _parent: unknown,
    _args: unknown,
    { events, user }: Context
  ): Promise<EventAttachmentUpload> => {
    adminOnly(user);
    return events.getUploadUrl({
      orgId: user.member.orgId!,
    });
  },
  removeEvent: async (
    _parent: unknown,
    { id }: { id: string },
    { events, user, organization }: Context
  ): Promise<string> => {
    adminOnly(user);
    const event = await events.get(id);
    if (!event) {
      throw new GraphQLError('Could not find event');
    }
    await events.removeEvent({
      event,
      organization: organization!,
      modifiedById: user!._id!,
    });
    return id;
  },
  approveEvent: async (
    _parent: unknown,
    { id }: { id: string },
    { events, venues, user, organization }: Context
  ): Promise<IEvent> => {
    adminOnly(user);
    const event = await events.get(id);
    if (!event) {
      throw new GraphQLError('Could not find event');
    }
    if (event.status !== EventStatus.Requested) {
      throw new GraphQLError('Event not up for approval');
    }

    event.status = EventStatus.Draft;
    await events.approveEvent(event._id!, user!._id!);

    if (event.venueId) {
      const venue = await venues.get(event.venueId);
      if (venue && venue.status === VenueStatus.Requested) {
        await venues.approveVenue(venue._id, user!._id!);
      }
    }

    await events.sendEventRequestMailerEvent({
      event,
      orgId: organization!.id,
      template: MailerEvents.EventRequestedApproved
    });

    return event;
  },
  rejectEvent: async (
    _parent: unknown,
    { id, reason }: { id: string, reason?: string },
    { events, venues, user, organization }: Context
  ): Promise<IEvent> => {
    adminOnly(user);
    const event = await events.get(id);
    if (!event) {
      throw new GraphQLError('Could not find event');
    }
    if (event.status !== EventStatus.Requested) {
      throw new GraphQLError('Event not up for approval');
    }

    await events.remove(event.id!, {
      modifiedById: user!._id!,
      status: EventStatus.Removed,
      'requestDetails.adminNote': reason || 'N/A',
    });

    if (event.requestDetails?.newVenue) {
      const venue = await venues.get(event.venueId!);
      if (venue && venue.status === VenueStatus.Requested) {
        await venues.rejectVenue(venue._id, user!._id!);
      }
    }

    await events.sendEventRequestMailerEvent({
      event: {
        ...event,
        requestDetails: {
          ...event.requestDetails,
          startTime: event.requestDetails?.startTime ? new Date(event.requestDetails.startTime) : undefined,
          endTime: event.requestDetails?.endTime ? new Date(event.requestDetails.endTime) : undefined,
          adminNote: reason || 'N/A',
        },
      },
      orgId: organization!.id,
      template: MailerEvents.EventRequestedRejected
    });

    return event;
  },
  templateEvent: async (
    _parent: unknown,
    { id }: { id: string },
    {
      events,
      organization,
      shifts,
      assignments,
      eventReferenceNumber,
      user
    }: Context
  ): Promise<IEvent> => {
    try {
      adminOnly(user);

      const clonedEvent = await events.cloneEvent({
        id,
        user: user!,
        organization: organization!,
        status: EventStatus.Template,
        getRefNumber: (id: string) => eventReferenceNumber.get(id),
      });

      const s = await shifts.findAllByEventId({
        eventId: new ObjectId(id),
      });

      await assignments.createTemplates({
        originalEventId: new ObjectId(id),
        event: clonedEvent,
        organization: organization!,
        user: user!,
        shifts: s,
        updateEventPostAssignmentClone: (id: ObjectId, assignmentIds: ObjectId[], modifiedById: ObjectId, otherSetValues: Record<string, any>) =>
          events.updateEventPostAssignmentCreate(id, assignmentIds, modifiedById, otherSetValues),
      });

      return clonedEvent;
    } catch(error) {
      logger.error('Failed to templetize event', { error });
      throw error;
    }
  },
  cloneEvent: async (
    _parent: unknown,
    { id }: { id: string },
    {
      events,
      assignments,
      eventReferenceNumber,
      user,
      shifts,
      organization,
    }: Context
  ): Promise<IEvent> => {
    try {
      adminOnly(user);

      const clonedEvent = await events.cloneEvent({
        id,
        user: user!,
        organization: organization!,
        getRefNumber: (id: string) => eventReferenceNumber.get(id),
      });

      await assignments.cloneAssignmentsByEvent({
        originalEventId: new ObjectId(id),
        event: clonedEvent,
        organization: organization!,
        user: user!,
        generateSlots: (assignmentId: ObjectId) => shifts.generateSlotsFromAssignment(assignmentId),
        updateEventPostAssignmentClone: (id: ObjectId, assignmentIds: ObjectId[], modifiedById: ObjectId, otherSetValues: Record<string, any>) =>
          events.updateEventPostAssignmentCreate(id, assignmentIds, modifiedById, otherSetValues),
      });

      return clonedEvent;
    } catch(error) {
      logger.error('Failed to clone event', { error });
      throw error;
    }
  },
  event: async (
    _parent: unknown,
    {
      event: {
        notifyOnFirstComeFirstServe,
        scheduledFirstComeFirstServe: scheduledFCFS,
        scheduledInterestList: scheduledInterest,
        scheduledCloseInterestList: scheduledCloseInterest,
        startTime,
        endTime,
        ...event
      }
    }: { event: IUpsertEvent },
    {
      events,
      shifts,
      scheduler,
      lotteryCounter,
      shiftLotteryRequests,
      eventReferenceNumber,
      user,
      organization,
      interestList,
    }: Context
  ): Promise<IEvent> => {
    adminOnly(user);

    let currentEvent: IEvent | undefined;
    if (event.id) {
      const foundEvent = await events.get(event.id);
      if (!foundEvent) {
        throw new GraphQLError('Could not find event');
      }
      currentEvent = foundEvent;
      // Remove this so it will be set as long as we pass in a first come first serve event
      delete currentEvent.notifyOnFirstComeFirstServe;
      event.referenceId = currentEvent.referenceId;
    } else {
      event.createdById = user!._id!;
      event.status = [
        EventStatus.Template,
        EventStatus.Incident,
      ].includes(event.status || EventStatus.Draft) ? event.status : EventStatus.Draft;
      event.referenceId = await eventReferenceNumber.get(organization.id);
    }

    let scheduledFirstComeFirstServe: Date | undefined;
    if (event.status === EventStatus.FirstComeFirstServe && scheduledFCFS) {
      scheduledFirstComeFirstServe = truncateToMinute(scheduledFCFS);
    } else if (event.status === EventStatus.FirstComeFirstServe && !scheduledFCFS) {
      scheduledFirstComeFirstServe = truncateToMinute(new Date());
    }
    let scheduledInterestList: Date | undefined;
    if (event.status === EventStatus.InterestList && scheduledInterest) {
      scheduledInterestList = truncateToMinute(scheduledInterest);
    } else if (event.status === EventStatus.InterestList && !scheduledInterest) {
      scheduledInterestList = truncateToMinute(new Date());
    }
    let scheduledCloseInterestList: Date | undefined;
    if (event.status === EventStatus.InterestList && scheduledCloseInterest) {
      scheduledCloseInterestList = truncateToMinute(scheduledCloseInterest);
    } else if (event.status === EventStatus.InterestList && !scheduledCloseInterest) {
      // TODO: Use organization default
      scheduledCloseInterestList = truncateToMinute(new Date());
    }
    const inputEvent = {
      ...event,
      id: event.id!,
      venueId: event.venueId ? new ObjectId(event.venueId) : undefined,
      assignmentIds: event.assignmentIds ? event.assignmentIds.map((id) => new ObjectId(id!)) : undefined,
      createdById: currentEvent ? currentEvent.createdById : user!._id!,
      ...(event.interestListAutoAssignCutoff && {
        interestListAutoAssignCutoff: truncateToMinute(new Date(event.interestListAutoAssignCutoff)),
      }),
      ...(event.supervisorId && { supervisorId: new ObjectId(event.supervisorId) }),
      ...(event.lieutenantId && { lieutenantId: new ObjectId(event.lieutenantId) }),
      ...(event.venueId && { venueId: new ObjectId(event.venueId) }),
      ...(event.requestDetails && {
        requestDetails: {
          ...event.requestDetails,
          ...(event.requestDetails.startTime && { startTime: new Date(event.requestDetails.startTime) }),
          ...(event.requestDetails.endTime && { endTime: new Date(event.requestDetails.endTime) }),
        }
      }),
      ...(
        event.status === EventStatus.FirstComeFirstServe ? {
          scheduledFirstComeFirstServe: scheduledFirstComeFirstServe,
          notifyOnFirstComeFirstServe,
        } : {
          scheduledFirstComeFirstServe: null,
          notifyOnFirstComeFirstServe: false
        }
      ),
      ...(
        event.status === EventStatus.InterestList ? {
          interestListTransition: event.interestListTransition ? event.interestListTransition : null,
          scheduledInterestList: scheduledInterestList,
          scheduledCloseInterestList: scheduledCloseInterestList,
        } : {
          interestListTransition: null,
          scheduledInterestList: null,
          scheduledCloseInterestList: null,
        }
      ),
      attachmentPaths: event?.attachmentPaths ? event?.attachmentPaths : event?.attachmentPaths || [],
      orgId: user.member.orgId!,
      modifiedById: user!._id!,
      searchAttribute: `${event.referenceId} ${event.name}`,
      docType: DocType.Event,
      ...([EventStatus.Incident].includes(event.status || EventStatus.Draft) && {
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
      })
    } as unknown as IEvent;

    if (typeof inputEvent.lotteryNumber === 'number' && inputEvent.status !== EventStatus.ReadyForLottery) {
      inputEvent.lotteryNumber = null;
    } else if (typeof inputEvent.lotteryNumber === 'number' && inputEvent.status === EventStatus.ReadyForLottery) {
      // Validate lottery number is greater than or equal to the current lottery counter
      const currentCounter = await lotteryCounter.get(inputEvent.orgId);
      // If the lottery number is in the past (currentCounter.counter should be next)
      // then we should just set it to the new lottery
      if (inputEvent.lotteryNumber < currentCounter.counter) {
        inputEvent.lotteryNumber = currentCounter.counter;
      }
    }

    if (currentEvent?.status === EventStatus.ReadyForLottery && inputEvent.status !== EventStatus.ReadyForLottery) {
      await shiftLotteryRequests.removeByEventId(currentEvent.id!, user!._id!);
    } else if (
      (
        (currentEvent?.status !== EventStatus.FirstComeFirstServe && inputEvent.status === EventStatus.FirstComeFirstServe) ||
        (inputEvent.status === EventStatus.FirstComeFirstServe && currentEvent?.scheduledFirstComeFirstServe !== inputEvent.scheduledFirstComeFirstServe) ||
        (inputEvent.status === EventStatus.FirstComeFirstServe && currentEvent?.notifyOnFirstComeFirstServe !== inputEvent.notifyOnFirstComeFirstServe)
      ) &&
      notifyOnFirstComeFirstServe
    ) {
      // If the event is going to FCFS within 2 minutes notify users now
      if (isAfter(new Date(), addMinutes(scheduledFirstComeFirstServe!, -1))) {
        await scheduler.removeSchedule({
          event: ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE,
          orgId: user.member.orgId,
          customEventName: `${ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE}-${currentEvent?.id}`,
          ignoreError: true,
        });
        await shifts.notifyUsersOfEventAvailability(currentEvent!.id!, organization!);
      } else {
        await scheduler.updateScheduledEvent({
          event: ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE,
          orgId: user.member.orgId!,
          eventTime: `at(${format(scheduledFirstComeFirstServe!, 'yyyy-MM-dd&&HH:mm:ss').replace('&&','T')})`,
          eventTimeZone: Timezone.UTC,
          customEventName: `${ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE}-${currentEvent?.id}`,
          eventInput: JSON.stringify({
            action: ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE,
            orgId: user.member.orgId!,
            eventId: currentEvent?.id,
          }),
        });
      }
    }

    // Clean up scheduled event if we are not going to FCFS
    if (inputEvent.status !== EventStatus.FirstComeFirstServe && currentEvent?.status === EventStatus.FirstComeFirstServe) {
      await scheduler.removeSchedule({
        event: ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE,
        orgId: user.member.orgId!,
        customEventName: `${ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE}-${currentEvent.id}`,
        ignoreError: true,
      });
    }

    logger.info('Upsert event', { inputEvent, event, currentEvent });
    let finalEvent: IEvent;
    if (!inputEvent.id) {
      finalEvent = await events.create(inputEvent);
    } else {
      finalEvent = await events.update({id: inputEvent.id!, ...inputEvent});
    }

    await interestList?.registerEventHooks({
      event: finalEvent,
      organization: organization!,
      beforeEvent: currentEvent,
    });

    return finalEvent;
  },
};