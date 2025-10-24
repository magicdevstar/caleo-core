import { GraphQLError } from "graphql";
import { adminOnly } from "../../../utils/access";
import { Context } from "../../../utils/createContext";
import { IAssignmentGroup } from "../../../models/assignmentGroup";

export const Mutation = {
  removeAssignmentGroup: async (
    _parent: unknown,
    { id }: { id: string },
    {
      assignmentGroups,
      user,
    }: Context
  ): Promise<string> => {
    adminOnly(user);
    await assignmentGroups.remove(id, {
      modifiedById: user!._id!,
    });
    return id;
  },
  assignmentGroup: async (
    _parent: unknown,
    { assignmentGroup: inputAG }: { assignmentGroup: IAssignmentGroup },
    { assignmentGroups, user }: Context
  ): Promise<IAssignmentGroup> => {
    adminOnly(user);
    if (Object.keys(inputAG).length === 0) {
      throw new GraphQLError("Assignment Groups is empty");
    }
    return assignmentGroups.upsert({
      ...inputAG,
      orgId: user.member.orgId,
      modifiedById: user!._id!,
    });
  },
};