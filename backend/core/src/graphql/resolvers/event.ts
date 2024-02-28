import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import {
  EventSearchInput,
  Event,
  UpsertEvent,
  EventStatus,
  EventAttachmentUpload
} from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import logger from "../../utils/logger";
import { format, setMilliseconds, addMinutes, setSeconds, isAfter } from "date-fns";
import { ScheduleEvent, Timezone } from "../../models/scheduler";

export const event = {
  Query: {
    event: async (
      _parent: unknown,
      { id }: { id: string },
      { events }: Context,
    ): Promise<Event | null> => events.get(id, { removed: true }),
    events: async (
      _parent: unknown,
      { input: { range, endTime, createdById, status, referenceIds, venueIds, ...input } }: { input: EventSearchInput },
      { events, lotteryCounter, organization, user }: Context
    ): Promise<SearchResults<Event>> => {
      let timeFilters: any = {};
      const $or: any[] = [];

      if (referenceIds) {
        (input as any).referenceId = { $in: referenceIds };
      }
      if (venueIds) {
        (input as any).venueId = { $in: venueIds };
      }

      const includeComplete = (status || []).includes(EventStatus.Complete);

      if (range) {
        const { startTime, endTime } = range;
        if (startTime && startTime.value) {
          timeFilters.startTime = new Date(startTime.value).getTime();
        } else if (startTime && (startTime.gte || startTime?.lte)) {
          timeFilters.startTime = {
            ...(startTime.gte ? { $gte: new Date(startTime.gte).getTime() } : {}),
            ...(startTime.lte ? { $lte: new Date(startTime.lte).getTime() } : {}),
          };
        }
  
        if (endTime && endTime.value) {
          timeFilters.endTime = new Date(endTime.value).getTime();
        } else if (endTime && (endTime.gte || endTime?.lte)) {
          timeFilters.endTime = {
            ...(endTime.gte ? { $gte: new Date(endTime.gte).getTime() } : {}),
            ...(endTime.lte ? { $lte: new Date(endTime.lte).getTime() } : {}),
          };
        }
      } else if (endTime && !includeComplete) {
        if (endTime.value) {
          timeFilters.endTime = new Date(endTime.value).getTime();
        } else if (endTime.gte || endTime?.lte) {
          $or.push({
            endTime: {
              ...(endTime.gte ? { $gte: new Date(endTime.gte).getTime() } : {}),
              ...(endTime.lte ? { $lte: new Date(endTime.lte).getTime() } : {}),
            }
          }, {
            endTime: { $exists: false },
          });
        }
      }
      if (createdById) {
        (input as any).createdById = { $in: createdById };
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
          const { counter } = await lotteryCounter.get(organization!.id);
          if (filteredStatus.length > 0 || includeComplete || includePreFCFS) {
            $or.push({
              lotteryNumber: counter,
            });
          } else {
            (input as any).lotteryNumber = counter;
          }
          filteredStatus.push(EventStatus.ReadyForLottery);
        } else if (includePreLottery) {
          const { counter } = await lotteryCounter.get(organization!.id);
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
              scheduledFirstComeFirstServe: { $gt: Date.now() },
            });
          } else {
            (input as any).scheduledFirstComeFirstServe = { $gt: Date.now() };
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

      return events.search({
        orgId: user?.member.orgId!,
        // Do not show complete events in the overtime search :)
        ...timeFilters,
        ...($or.length > 0 ? { $or } : {}),
        ...input,
        queryField: 'searchAttribute',
      })
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
        modifiedById: user!.id,
      });
      return id;
    },
    event: async (
      _parent: unknown,
      {
        event: {
          notifyOnFirstComeFirstServe,
          scheduledFirstComeFirstServe: scheduledFCFS,
          ...event
        }
      }: { event: UpsertEvent },
      {
        events,
        shifts,
        scheduler,
        shiftLotteryRequests,
        eventReferenceNumber,
        user,
        organization,
      }: Context
    ): Promise<Event> => {
      adminOnly(user);

      let currentEvent: any = {};
      if (event.id) {
        currentEvent = await events.get(event.id);
        // Remove this so it will be set as long as we pass in a first come first serve event
        delete currentEvent.notifyOnFirstComeFirstServe;
        delete currentEvent.scheduledFirstComeFirstServe;
        if (!currentEvent) {
          throw new GraphQLError('Could not find event');
        }
      } else {
        (event as any).createdById = user!.id;
        (event as any).status = EventStatus.Draft;
        (event as any).referenceId = await eventReferenceNumber.get(organization!.id);
      }

      let scheduledFirstComeFirstServe;
      if (event.status === EventStatus.FirstComeFirstServe && scheduledFCFS) {
        scheduledFirstComeFirstServe = setMilliseconds(setSeconds(new Date(scheduledFCFS), 0), 0);
      } else if (event.status === EventStatus.FirstComeFirstServe && !scheduledFCFS) {
        scheduledFirstComeFirstServe = setMilliseconds(setSeconds(new Date(), 0), 0);
      }
      const inputEvent = {
        ...currentEvent,
        ...event,
        ...(
          event.status === EventStatus.FirstComeFirstServe ? {
            scheduledFirstComeFirstServe: scheduledFirstComeFirstServe.getTime(),
            notifyOnFirstComeFirstServe,
          } : {
            scheduledFirstComeFirstServe: null,
            notifyOnFirstComeFirstServe: false
          }
        ),
        attachmentPaths: event?.attachmentPaths ? event?.attachmentPaths : event?.attachmentPaths || [],
        orgId: user?.member.orgId!,
        modifiedById: user!.id,
      };

      inputEvent.searchAttribute = `${inputEvent.referenceId} ${inputEvent.name}`;

      if (typeof inputEvent.lotteryNumber === 'number' && inputEvent.status !== EventStatus.ReadyForLottery) {
        inputEvent.lotteryNumber = null;
      }

      if (currentEvent.status === EventStatus.ReadyForLottery && inputEvent.status !== EventStatus.ReadyForLottery) {
        await shiftLotteryRequests.removeByEventId(currentEvent.id, user!.id);
      } else if (
        (
          (currentEvent.status !== EventStatus.FirstComeFirstServe && inputEvent.status === EventStatus.FirstComeFirstServe) ||
          (inputEvent.status === EventStatus.FirstComeFirstServe && currentEvent.scheduledFirstComeFirstServe !== inputEvent.scheduledFirstComeFirstServe) ||
          (inputEvent.status === EventStatus.FirstComeFirstServe && currentEvent.notifyOnFirstComeFirstServe !== inputEvent.notifyOnFirstComeFirstServe)
        ) &&
        notifyOnFirstComeFirstServe
      ) {
        // If the event is going to FCFS within 2 minutes notify users now
        if (isAfter(new Date(), addMinutes(scheduledFirstComeFirstServe, -1))) {
          await scheduler.removeSchedule({
            event: ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE,
            orgId: user?.member.orgId!,
            customEventName: `${ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE}-${currentEvent.id}`,
            ignoreError: true,
          });
          await shifts.notifyUsersOfEventAvailability(currentEvent.id, organization!);
        } else {
          await scheduler.updateScheduledEvent({
            event: ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE,
            orgId: user?.member.orgId!,
            eventTime: `at(${format(scheduledFirstComeFirstServe, 'yyyy-MM-dd&&HH:mm:ss').replace('&&','T')})`,
            eventTimeZone: Timezone.UTC,
            customEventName: `${ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE}-${currentEvent.id}`,
            eventInput: JSON.stringify({
              action: ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE,
              orgId: user?.member.orgId!,
              eventId: currentEvent.id,
            }),
          });
        }
      }

      // Clean up scheduled event if we are not going to FCFS
      if (inputEvent.status !== EventStatus.FirstComeFirstServe) {
        await scheduler.removeSchedule({
          event: ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE,
          orgId: user?.member.orgId!,
          customEventName: `${ScheduleEvent.EVENT_FIRST_COME_FIRST_SERVE_GO_LIVE}-${currentEvent.id}`,
          ignoreError: true,
        });
      }

      logger.info('Upsert event', { inputEvent, event, currentEvent });
      let finalEvent: any;
      if (!inputEvent.id) {
        finalEvent = await events.create(inputEvent);
      } else {
        finalEvent = await events.update(inputEvent as any);
      }

      return finalEvent;
    },
  },
  fields: {
    Event: {
      ...commonResolvers,
      createdBy: (event: Event, _, { users }: Context) => event.createdById ? users.loader.load(event.createdById) : null,
      org: (event: Event, _, { organizations }: Context) => organizations.loader.load(event.orgId),
      venue: (event: Event, _, { venues }: Context) => event.venueId ? venues.loader.load(event.venueId) : null,
      assignments: (event: Event, _, { assignments }: Context) => assignments.loader.loadMany((event.assignmentIds || []) as any),
      startTime: (item: Event) => item.startTime ? new Date(item.startTime).toISOString() : null,
      endTime: (item: Event) => item.endTime ? new Date(item.endTime).toISOString() : null,
      scheduledFirstComeFirstServe: (item: Event) => item.scheduledFirstComeFirstServe ? new Date(item.scheduledFirstComeFirstServe).toISOString() : null,
      lotteryCounter: (item: Event, _, { lotteryCounter }: Context) => typeof item.lotteryNumber === 'number' ? lotteryCounter.countLoader.load(item.lotteryNumber!) : null,
      attachments: async (item: Event, _arg: unknown, { events }: Context) => {
        if (!item.attachmentPaths) {
          return [];
        }
        const results = await Promise.allSettled((item.attachmentPaths || []).map((path) => {
          return events.getDownloadUrl(path as string);
        }));

        return results.filter((result) => result.status === 'fulfilled').map((result: any) => result.value);
      },
      availableShifts: async (item: Event, _arg: unknown, { shifts }: Context) => shifts.eventShiftCount.load(item.id),
    },
  },
};
