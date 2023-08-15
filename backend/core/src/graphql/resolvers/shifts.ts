import { GraphQLError } from "graphql";
import { Context } from "../..";
import { SearchInput, Shift, ShiftStatus, UpsertShift } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";

export const shift = {
  Query: {
    shift: async (
      _parent: unknown,
      { id }: { id: string },
      { shifts }: Context,
    ): Promise<Shift | null> => shifts.get(id),
    shifts: async (
      _parent: unknown,
      { limit, skip }: SearchInput,
      { shifts, user }: Context
    ): Promise<SearchResults<Shift>> => shifts.search({
      limit,
      skip,
      orgId: user?.member.orgId!,
    })
  },
  Mutation: {
    removeShift: async (
      _parent: unknown,
      { id }: { id: string },
      { assignments, shifts, user }: Context
    ): Promise<string> => {
      adminOnly(user);

      const shift = await shifts.get(id);
      if (!shift) {
        throw new GraphQLError("Shift not found");
      }
      
      await shifts.remove(id);
      
      const assignment = await assignments.get(shift.assignmentId);
      if (assignment) {
        await assignments.update({
          ...assignment,
          shiftIds: (assignment.shiftIds || []).filter((sid) => sid !== id),
        } as any, { skipMerge: true });
      }

      return id;
    },
    shift: async (
      _parent: unknown,
      { shift }: { shift: UpsertShift },
      { assignments, shifts, user }: Context
    ): Promise<Shift> => {
      adminOnly(user);

      const assignment = await assignments.get(shift.assignmentId);
      if (!assignment) {
        throw new GraphQLError("Assignment not found");
      }

      if (shift.id) {
        shift.status = ShiftStatus.Pending;
      }

      const updatedShift = await shifts.upsert({
        ...shift,
        orgId: user?.member.orgId!,
      } as any);

      if (!shift.id) {
        await assignments.update({
          ...assignment,
          shiftIds: [...(assignment.shiftIds || []), updatedShift.id],
        } as any, { skipMerge: true });
      }

      return updatedShift;
    },
  },
  fields: {
    Shift: {
      ...commonResolvers,
      org: (shift: Shift, _, { organizations }: Context) => organizations.loader.load(shift.orgId),
      event: (shift: Shift, _, { events }: Context) => events.loader.load(shift.eventId),
      assignment: (shift: Shift, _, { assignments }: Context) => assignments.loader.load(shift.assignmentId),
    },
  },
};
