import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import {
  EventSearchInput,
  EventStatus,
  EventAttachmentUpload,
  VenueStatus,
  DocType
} from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import logger from "../../utils/logger";
import { format, setMilliseconds, addMinutes, setSeconds, isAfter, subHours } from "date-fns";
import { ScheduleEvent, Timezone } from "../../models/scheduler";
import { MailerEvents } from "../../types/mailer";
import { IEvent, IUpsertEvent } from "../../models/event";
import { ObjectId } from "mongodb";
import { truncateToMinute } from "../../utils/date.helpers";

export const event = {
  Query: {
    event: async (
      _parent: unknown,
      { id }: { id: string },
      { events }: Context,
    ): Promise<IEvent | null> => events.get(id, { removed: true }),
    events: async (
      _parent: unknown,
      { input: { range, endTime, createdById, status, referenceIds, venueIds, ...input } }: { input: EventSearchInput },
      { events, lotteryCounter, organization, user }: Context
    ): Promise<SearchResults<IEvent>> => {
      let timeFilters: any = {};
      const $or: any[] = [];

      if (referenceIds) {
        (input as any).referenceId = { $in: referenceIds };
      }
      if (venueIds) {
        (input as any).venueId = { $in: venueIds.map((id) => new ObjectId(id!)) };
      }

      const includeComplete = (status || []).includes(EventStatus.Complete);

      if (range) {
        const { startTime, endTime } = range;
        if (startTime && startTime.value) {
          timeFilters.startTime = new Date(startTime.value);
        } else if (startTime && (startTime.gte || startTime?.lte)) {
          timeFilters.startTime = {
            ...(startTime.gte ? { $gte: new Date(startTime.gte) } : {}),
            ...(startTime.lte ? { $lte: new Date(startTime.lte) } : {}),
          };
        }
  
        if (endTime && endTime.value) {
          timeFilters.endTime = new Date(endTime.value);
        } else if (endTime && (endTime.gte || endTime?.lte)) {
          timeFilters.endTime = {
            ...(endTime.gte ? { $gte: new Date(endTime.gte) } : {}),
            ...(endTime.lte ? { $lte: new Date(endTime.lte) } : {}),
          };
        }
      } else if (endTime && !includeComplete) {
        if (endTime.value) {
          timeFilters.endTime = new Date(endTime.value);
        } else if (endTime.gte || endTime?.lte) {
          $or.push({
            endTime: {
              ...(endTime.gte ? { $gte: new Date(endTime.gte) } : {}),
              ...(endTime.lte ? { $lte: new Date(endTime.lte) } : {}),
            }
          }, {
            endTime: { $exists: false },
          });
        }
      }
      if (createdById) {
        (input as any).createdById = { $in: createdById.map((id) => new ObjectId(id!)) };
      }
      // Kill me :) Maybe I should consider just calculating the status with event bridge instead of this mess
      if (status) {
        const includeLottery = status.includes(EventStatus.ReadyForLottery);
        const includePreLottery = status.includes(EventStatus.PreLottery);
        const includePreFCFS = status.includes(EventStatus.PreFirstComeFirstServe);
        const includeRemoved = status.includes(EventStatus.Removed);
        const filteredStatus = status.filter((s: any) => ![
          EventStatus.ReadyForLottery,
          EventStatus.PreLottery,
          EventStatus.PreFirstComeFirstServe,
        ].includes(s));

        if (includeLottery && includePreLottery) {
          filteredStatus.push(EventStatus.ReadyForLottery);
        } else if (includeLottery) {
          const { counter } = await lotteryCounter.get(organization!._id!);
          if (filteredStatus.length > 0 || includeComplete || includePreFCFS) {
            $or.push({
              lotteryNumber: counter,
            });
          } else {
            (input as any).lotteryNumber = counter;
          }
          filteredStatus.push(EventStatus.ReadyForLottery);
        } else if (includePreLottery) {
          const { counter } = await lotteryCounter.get(organization!._id!);
          if (filteredStatus.length > 0 || includeComplete || includePreFCFS) {
            $or.push({
              lotteryNumber: { $gt: counter },
            });
          } else {
            (input as any).lotteryNumber = { $gt: counter };
          }
          filteredStatus.push(EventStatus.ReadyForLottery);
        }
        if (includePreFCFS) {
          if (filteredStatus.length > 0 || includeComplete || includeLottery || includePreLottery) {
            $or.push({
              scheduledFirstComeFirstServe: { $gt: new Date() },
            });
          } else {
            (input as any).scheduledFirstComeFirstServe = { $gt: new Date() };
          }
          filteredStatus.push(EventStatus.FirstComeFirstServe);
        }
        if (includeRemoved) {
          (input as any).includeRemoved = true;
        } 
        if (filteredStatus.length > 0) {
          (input as any).status = { $in: filteredStatus };
        }
      }

      return await events.search({
        orgId: user?.member.orgId!,
        // Do not show complete events in the overtime search :)
        ...timeFilters,
        ...($or.length > 0 ? { $or } : {}),
        ...input,
        ...(!(input as any).status ? { status: { $ne: EventStatus.Template } } : {}),
        queryField: 'searchAttribute',
      });
    }
  },
  Mutation: {
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
        orgId: user?.member.orgId!,
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
          eventId: clonedEvent._id!,
          organization: organization!,
          user: user!,
          shifts: s,
          addAssignmentIds: (id: ObjectId, assignmentIds: ObjectId[], modifiedById: ObjectId) =>
            events.addAssignmentIds(id, assignmentIds, modifiedById),
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
          eventId: clonedEvent._id!,
          organization: organization!,
          user: user!,
          generateSlots: (assignmentId: ObjectId) => shifts.generateSlotsFromAssignment(assignmentId),
          addAssignmentIds: (id: ObjectId, assignmentIds: ObjectId[], modifiedById: ObjectId) =>
            events.addAssignmentIds(id, assignmentIds, modifiedById),
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
        let foundEvent = await events.get(event.id);
        if (!foundEvent) {
          throw new GraphQLError('Could not find event');
        }
        currentEvent = foundEvent;
        // Remove this so it will be set as long as we pass in a first come first serve event
        delete currentEvent.notifyOnFirstComeFirstServe;
        event.referenceId = currentEvent.referenceId;
      } else {
        event.createdById = user!._id!;
        event.status = event.status === EventStatus.Template ? event.status : EventStatus.Draft;
        event.referenceId = await eventReferenceNumber.get(organization!.id);
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
        orgId: user?.member.orgId!,
        modifiedById: user!._id!,
        searchAttribute: `${event.referenceId} ${event.name}`,
        docType: DocType.Event,
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
        await shiftLotteryRequests.removeByEventId(currentEvent?.id!, user!._id!);
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
            orgId: user?.member.orgId!,
            customEventName: `${ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE}-${currentEvent?.id}`,
            ignoreError: true,
          });
          await shifts.notifyUsersOfEventAvailability(currentEvent?.id!, organization!);
        } else {
          await scheduler.updateScheduledEvent({
            event: ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE,
            orgId: user?.member.orgId!,
            eventTime: `at(${format(scheduledFirstComeFirstServe!, 'yyyy-MM-dd&&HH:mm:ss').replace('&&','T')})`,
            eventTimeZone: Timezone.UTC,
            customEventName: `${ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE}-${currentEvent?.id}`,
            eventInput: JSON.stringify({
              action: ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE,
              orgId: user?.member.orgId!,
              eventId: currentEvent?.id,
            }),
          });
        }
      }

      // Clean up scheduled event if we are not going to FCFS
      if (inputEvent.status !== EventStatus.FirstComeFirstServe && currentEvent?.status === EventStatus.FirstComeFirstServe) {
        await scheduler.removeSchedule({
          event: ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE,
          orgId: user?.member.orgId!,
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
  },
  fields: {
    Event: {
      ...commonResolvers,
      createdBy: (event: IEvent, _, { users }: Context) => event.createdById ? users.loader.load(event.createdById.toString()) : null,
      supervisor: (event: IEvent, _, { users }: Context) => event.supervisorId ? users.loader.load(event.supervisorId.toString()) : null,
      lieutenant: (event: IEvent, _, { users }: Context) => event.lieutenantId ? users.loader.load(event.lieutenantId.toString()) : null,
      org: (event: IEvent, _, { organizations }: Context) => organizations.loader.load(event.orgId.toString()),
      venue: (event: IEvent, _, { venues }: Context) => event.venueId ? venues.loader.load(event.venueId.toString()) : null,
      assignments: (event: IEvent, _, { assignments }: Context) => assignments.loader.loadMany((event.assignmentIds || []).map((id) => id.toString())),
      startTime: (item: IEvent) => item.startTime ? new Date(item.startTime).toISOString() : null,
      endTime: (item: IEvent) => item.endTime ? new Date(item.endTime).toISOString() : null,
      scheduledFirstComeFirstServe: (item: IEvent) => item.scheduledFirstComeFirstServe ? new Date(item.scheduledFirstComeFirstServe).toISOString() : null,
      scheduledInterestList: (item: IEvent) => item.scheduledInterestList ? new Date(item.scheduledInterestList).toISOString() : null,
      scheduledCloseInterestList: (item: IEvent) => item.scheduledCloseInterestList ? new Date(item.scheduledCloseInterestList).toISOString() : null,
      lotteryCounter: (item: IEvent, _, { lotteryCounter }: Context) => typeof item.lotteryNumber === 'number' ? lotteryCounter.countLoader.load({lotteryNumber: item.lotteryNumber!, orgId: item.orgId.toString()}) : null,
      attachments: async (item: IEvent, _arg: unknown, { events }: Context) => {
        if (!item.attachmentPaths) {
          return [];
        }
        const results = await Promise.allSettled((item.attachmentPaths || []).map((path) => {
          return events.getDownloadUrl(path as string);
        }));

        return results.filter((result) => result.status === 'fulfilled').map((result: any) => result.value);
      },
      availableShifts: async (item: IEvent, _arg: unknown, { shifts }: Context) => shifts.availableShiftsOnEvent.load(item.id!),
      totalShifts: async (item: IEvent, _arg: unknown, { shifts }: Context) => shifts.totalShiftsOnEvent.load(item.id!),
    },
  },
};
