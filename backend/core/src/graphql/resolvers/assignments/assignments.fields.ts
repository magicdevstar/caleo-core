import { IAssignment } from "../../../models/assignment";
import { Context } from "../../../utils/createContext";
import { commonResolvers } from "../../../utils/common.resolvers";

export const fields = {
  Assignment: {
    ...commonResolvers,
    org: (assignment: IAssignment, _, { organizations }: Context) => organizations.loader.load(assignment.orgId.toString()),
    event: (assignment: IAssignment, _, { events }: Context) => events.loader.load(assignment.eventId.toString()),
    requiredSkills: (assignment: IAssignment, _, { skills }: Context) => skills.loader.loadMany((assignment.requiredSkillIds || []).map((id) => id.toString())),
    requiredEquipment: (event: IAssignment, _, { equipments }: Context) =>
            event.requiredEquipmentIds && event.requiredEquipmentIds.length > 0 ?
              equipments.loader.loadMany((event.requiredEquipmentIds || []).map((id) => id.toString())) :
              [],
    ranks: (assignment: IAssignment, _, { ranks }: Context) => ranks.loader.loadMany((assignment.rankIds || []).map((id) => id.toString())),
    shifts: (assignment: IAssignment, _, { shifts }: Context) => shifts.loadShiftsByAssignmentId.load(assignment._id!),
    availableShifts: async (item: IAssignment, _arg: unknown, { shifts }: Context) => shifts.availableShiftsOnAssignment.load(item.id!.toString()!),
    totalShifts: async (item: IAssignment, _arg: unknown, { shifts }: Context) => shifts.totalShiftsOnAssignment.load(item.id!.toString()!),
    supervisorAssignment: (assignment: IAssignment, _, { assignments }: Context) => assignment.supervisorAssignmentId ? assignments.loader.load(assignment.supervisorAssignmentId.toString()) : null,
    lieutenantAssignment: (assignment: IAssignment, _, { assignments }: Context) => assignment.lieutenantAssignmentId ? assignments.loader.load(assignment.lieutenantAssignmentId.toString()) : null,
    fieldSupervisorAssignment: (assignment: IAssignment, _, { assignments }: Context) => assignment.fieldSupervisorAssignmentId ? assignments.loader.load(assignment.fieldSupervisorAssignmentId.toString()) : null,
    overrideSigner: (assignment: IAssignment, _, { users }: Context) => assignment.overrideSignerId ? users.loader.load(assignment.overrideSignerId.toString()) : null,
    assignmentDivision: (assignment: IAssignment, _, { assignmentDivisions }: Context) => assignment.assignmentDivisionId ? assignmentDivisions.loader.load(assignment.assignmentDivisionId.toString()) : null,
    assignmentGroup: (assignment: IAssignment, _, { assignmentGroups }: Context) => assignment.assignmentGroupId ? assignmentGroups.loader.load(assignment.assignmentGroupId.toString()) : null,
    branch: (assignment: IAssignment, _, { branches }: Context) => assignment.branchId ? branches.loader.load(assignment.branchId.toString()) : null,
  },
};
