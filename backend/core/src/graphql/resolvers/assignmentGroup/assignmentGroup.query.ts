import { AssignmentGroupSearchInput } from "../../../__generated__/resolvers-types";
import { IAssignmentGroup } from "../../../models/assignmentGroup";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
  assignmentGroup: async (
    _parent: unknown,
    { id }: { id: string },
    { assignmentGroups }: Context,
  ): Promise<IAssignmentGroup | null> => assignmentGroups.get(id),
  assignmentGroups: async (
    _parent: unknown,
    { input }: { input: AssignmentGroupSearchInput },
    { assignmentGroups, user }: Context
  ): Promise<SearchResults<IAssignmentGroup>> => assignmentGroups.search({
    orgId: user.member.orgId,
    queryField: 'name',
    ...input,
  }),
};
