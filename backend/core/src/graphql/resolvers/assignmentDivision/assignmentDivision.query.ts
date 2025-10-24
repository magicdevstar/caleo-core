import { AssignmentDivisionSearchInput } from "../../../__generated__/resolvers-types";
import { IAssignmentDivision } from "../../../models/assignmentDivision";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const Query = {
  assignmentDivision: async (
    _parent: unknown,
    { id }: { id: string },
    { assignmentDivisions }: Context,
  ): Promise<IAssignmentDivision | null> => assignmentDivisions.get(id),
  assignmentDivisions: async (
    _parent: unknown,
    { input }: { input: AssignmentDivisionSearchInput },
    { assignmentDivisions, user }: Context
  ): Promise<SearchResults<IAssignmentDivision>> => assignmentDivisions.search({
    orgId: user.member.orgId,
    queryField: 'name',
    ...input,
  }),
};
