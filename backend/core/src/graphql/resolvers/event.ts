import { GraphQLError } from "graphql";
import { Context } from "../..";
import { EventSearchInput, Event, UpsertEvent, EventStatus, DocType, EventAttachmentUpload } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import logger from "../../utils/logger";
import { ScheduleEvent } from "../../models/scheduler";

export const event = {
  Query: {
    event: async (
      _parent: unknown,
      { id }: { id: string },
      { events }: Context,
    ): Promise<Event | null> => events.get(id),
    events: async (
      _parent: unknown,
      { input }: { input: EventSearchInput },
      { events, user }: Context
    ): Promise<SearchResults<Event>> => events.search({
      orgId: user?.member.orgId!,
      // Do not show complete events in the overtime search :)
      status: {
        $nin: [EventStatus.Complete],
      },
      ...input,
    })
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
      { events, shifts, assignments, user }: Context
    ): Promise<string> => {
      adminOnly(user);
      await events.remove(id);

      await assignments.removeAllByEventId(user?.member.orgId!, id);
      await shifts.removeAllByEventId(user?.member.orgId!, id);

      return id;
    },
    event: async (
      _parent: unknown,
      { event }: { event: UpsertEvent },
      { events, shifts, scheduler, user }: Context
    ): Promise<Event> => {
      adminOnly(user);

      if (event.id) {
        const currentEvent = await events.get(event.id);
        if (!currentEvent) {
          throw new GraphQLError('Could not find event');
        }
        if (!event.assignmentIds || event.assignmentIds.length === 0) {
          (event as any).status = EventStatus.Draft;
        } else if (currentEvent?.status === EventStatus.Draft) {
          const totalShifts = await shifts.collection.countDocuments({
            eventId: event.id,
          });
          // TODO: Set default status based on org settings :)
          if (totalShifts > 0) {
            (event as any).status = EventStatus.ReadyForLottery;
          }
        }
      } else {
        (event as any).status = EventStatus.Draft;
      }

      logger.info('Upsert event', { event: {
        ...event,
        orgId: user?.member.orgId!,
      } as any });

      const finalEvent = await events.upsert({
        ...event,
        orgId: user?.member.orgId!,
      } as any);

      // TODO: Schedule or remove schedule for first come first serve event

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
      attachments: async (item: Event, _arg: unknown, { events }: Context) => {
        if (!item.attachments) {
          return [];
        }
        const results = await Promise.allSettled((item.attachmentPaths || []).map((path) => {
          return events.getDownloadUrl(path as string);
        }));

        return results.filter((result) => result.status === 'fulfilled').map((result: any) => result.value);
      }
    },
  },
};
