import { GraphQLError } from "graphql";
import { adminOnly } from "../../../utils/access";
import { Context } from "../../../utils/createContext";
import { IAssignmentDivision } from "../../../models/assignmentDivision";

export const Mutation = {
  removeAssignmentDivision: async (
    _parent: unknown,
    { id }: { id: string },
    {
      assignmentDivisions,
      user,
    }: Context
  ): Promise<string> => {
    adminOnly(user);
    await assignmentDivisions.remove(id, {
      modifiedById: user!._id!,
    });
    return id;
  },
  assignmentDivision: async (
    _parent: unknown,
    { assignmentDivision: inputAD }: { assignmentDivision: IAssignmentDivision },
    { assignmentDivisions, user }: Context
  ): Promise<IAssignmentDivision> => {
    adminOnly(user);
    if (Object.keys(inputAD).length === 0) {
      throw new GraphQLError("Assignment Division is empty");
    }
    return assignmentDivisions.upsert({
      ...inputAD,
      orgId: user.member.orgId,
      modifiedById: user!._id!,
    });
  },
};