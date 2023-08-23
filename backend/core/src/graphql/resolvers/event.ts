import { GraphQLError } from "graphql";
import { Context } from "../..";
import { EventSearchInput, Event, UpsertEvent, EventStatus, DocType } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import logger from "../../utils/logger";

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
      ...input,
    })
  },
  Mutation: {
    removeEvent: async (
      _parent: unknown,
      { id }: { id: string },
      { events, shifts, assignments, user }: Context
    ): Promise<string> => {
      adminOnly(user);
      await events.remove(id);

      const assignmentRes = await assignments.collection.deleteMany({
        orgId: user?.member.orgId!,
        docType: DocType.Assignment,
        eventId: id,
      });
      const shiftRes = await shifts.collection.deleteMany({
        orgId: user?.member.orgId!,
        docType: DocType.Shift,
        eventId: id,
      });
      
      if (assignmentRes.deletedCount === 0) {
        logger.warn('No assignments removed', {
          orgId: user?.member.orgId!,
          docType: DocType.Assignment,
          eventId: id,
        });
      }
      if (shiftRes.deletedCount === 0) {
        logger.warn('No shifts removed', {
          orgId: user?.member.orgId!,
          docType: DocType.Shift,
          eventId: id,
        });
      }

      return id;
    },
    event: async (
      _parent: unknown,
      { event }: { event: UpsertEvent },
      { events, shifts, user }: Context
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
          const { items: eventShifts } = await shifts.search({
            eventId: event.id
          });
          if (eventShifts.length > 0) {
            (event as any).status = EventStatus.ReadyForLottery;
          }
        }
      } else {
        (event as any).status = EventStatus.Draft;
      }

      return events.upsert({
        ...event,
        orgId: user?.member.orgId!,
      } as any);
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
    },
  },
};
