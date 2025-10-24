import { IAssignmentGroup } from "../../../models/assignmentGroup";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  AssignmentGroup: {
    ...commonResolvers,
    org: (ag: IAssignmentGroup, _: any, { organizations }: Context) => organizations.loader.load(ag.orgId.toString()),
  },
};