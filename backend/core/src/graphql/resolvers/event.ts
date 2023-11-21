import { GraphQLError } from "graphql";
import { Context } from "../../utils/createContext";
import { EventSearchInput, Event, UpsertEvent, EventStatus, EventAttachmentUpload } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import logger from "../../utils/logger";
import { isAfter, setMinutes, setSeconds } from "date-fns";

export const event = {
  Query: {
    event: async (
      _parent: unknown,
      { id }: { id: string },
      { events }: Context,
    ): Promise<Event | null> => events.get(id),
    events: async (
      _parent: unknown,
      { input: { startTime, endTime, ...input } }: { input: EventSearchInput },
      { events, user }: Context
    ): Promise<SearchResults<Event>> => {
      const timeFilters: any = {};
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
      return events.search({
        orgId: user?.member.orgId!,
        // Do not show complete events in the overtime search :)
        ...timeFilters,
        status: {
          $nin: [EventStatus.Complete],
        },
        ...input,
      })
    }
  },
  Mutation: {
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
      { event }: { event: UpsertEvent },
      { events, eventReferenceNumber, user }: Context
    ): Promise<Event> => {
      adminOnly(user);

      let currentEvent: any = {};
      if (event.id) {
        currentEvent = await events.get(event.id);
        if (!currentEvent) {
          throw new GraphQLError('Could not find event');
        }
      } else {
        (event as any).status = EventStatus.Draft;
        (event as any).referenceId = await eventReferenceNumber.get();
      }

      const inputEvent = {
        ...currentEvent,
        ...event,
        ...(
          event.scheduledFirstComeFirstServe ? {
            scheduledFirstComeFirstServe: setMinutes(setSeconds(new Date(event.scheduledFirstComeFirstServe), 0), 0).getTime(),
          } : {}
        ),
        attachmentPaths: event?.attachmentPaths ? event?.attachmentPaths : event?.attachmentPaths || [],
        orgId: user?.member.orgId!,
        modifiedById: user!.id,
      };

      logger.info('Upsert event', { event: inputEvent });
      let finalEvent: any;
      if (!inputEvent.id) {
        finalEvent = await events.create(inputEvent);
      } else {
        finalEvent = await events.update(inputEvent as any, { skipMerge: true });
      }

      return finalEvent;
    },
  },
  fields: {
    Event: {
      ...commonResolvers,
      org: (event: Event, _, { organizations }: Context) => organizations.loader.load(event.orgId),
      venue: (event: Event, _, { venues }: Context) => event.venueId ? venues.loader.load(event.venueId) : null,
      assignments: (event: Event, _, { assignments }: Context) => assignments.loader.loadMany((event.assignmentIds || []) as any),
      startTime: (item: Event) => item.startTime ? new Date(item.startTime).toISOString() : null,
      endTime: (item: Event) => item.endTime ? new Date(item.endTime).toISOString() : null,
      scheduledFirstComeFirstServe: (item: Event) => item.scheduledFirstComeFirstServe ? new Date(item.scheduledFirstComeFirstServe).toISOString() : null,
      status: (item: Event) => {
        if (item.endTime && isAfter(new Date(), new Date(item.endTime))) {
          return EventStatus.Complete;
        }
        return item.status;
      },
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
