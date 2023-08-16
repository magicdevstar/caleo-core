import { Context } from "../..";
import { EventSearchInput, Event, UpsertEvent } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";

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
      const { items: assignmentDocs } = await assignments.search({
        eventId: id,
      });

      // Remove all assignments and shifts
      await Promise.allSettled(assignmentDocs.map(async (assignment) => {
        const { items: shiftDocs } = await shifts.search({
          assignmentId: assignment.id,
        });
        await Promise.allSettled(shiftDocs.map((shift) => shifts.remove(shift.id)));
        return assignments.remove(assignment.id);
      }));

      return id;
    },
    event: async (
      _parent: unknown,
      { event }: { event: UpsertEvent },
      { events, user }: Context
    ): Promise<Event> => {
      adminOnly(user);
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
    },
  },
};
