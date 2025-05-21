import { Context } from "../../../utils/createContext";
import { AssignmentSearchInput } from "../../../__generated__/resolvers-types";
import { SearchResults } from "../../../utils/common.resolvers";
import { IAssignment } from "../../../models/assignment";
import { ObjectId } from "mongodb";

export const Query = {
  assignment: async (
    _parent: unknown,
    { id }: { id: string },
    { assignments }: Context,
  ): Promise<IAssignment | null> => assignments.get(id, { removed: true }),
  assignments: async (
    _parent: unknown,
    { input: {limit, skip, ...input} }: {input: AssignmentSearchInput},
    { assignments, user }: Context
  ): Promise<SearchResults<IAssignment>> => assignments.search({
    limit,
    skip,
    ...input,
    ...(input.eventId && { eventId: new ObjectId(input.eventId) }),
    orgId: user.member.orgId,
  })
};
