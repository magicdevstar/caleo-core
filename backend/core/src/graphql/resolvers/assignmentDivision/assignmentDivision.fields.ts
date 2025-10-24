import { IAssignmentDivision } from "../../../models/assignmentDivision";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  AssignmentDivision: {
    ...commonResolvers,
    org: (ad: IAssignmentDivision, _: any, { organizations }: Context) => organizations.loader.load(ad.orgId.toString()),
  },
};