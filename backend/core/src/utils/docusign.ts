import { AssignmentModel, IAssignment } from "../models/assignment";
import { IEvent } from "../models/event";
import { UserModel } from "../models/user";
import { IUser } from "../types/common";

export const getEventLeadership = async ({
  users,
  assignments,
  event,
  assignment,
}:{
  users: UserModel,
  assignments: AssignmentModel,
  event: IEvent,
  assignment: IAssignment
}) => {
  let supervisor: IUser | null = null;
  if (assignment.useSupervisorAssignmentOverride) {
    supervisor = await users.get(event?.overrideSupervisorId);
  } else {
    const eventSupervisor = await assignments.getSigningAuthorityUser(event.supervisorAssignmentId);
    const assignmentSupervisor = await assignments.getSigningAuthorityUser(assignment?.supervisorAssignmentId);

    supervisor = assignmentSupervisor || eventSupervisor;
  }

  let lieutenant: IUser | null = null;
  if (assignment.useLieutenantAssignmentOverride) {
    lieutenant = await users.get(event?.overrideSupervisorId);
  } else {
    const eventLieutenant = await assignments.getSigningAuthorityUser(event.lieutenantAssignmentId);
    const assignmentLieutenant = await assignments.getSigningAuthorityUser(assignment?.lieutenantAssignmentId);

    lieutenant = assignmentLieutenant || eventLieutenant;
  }

  return {
    supervisor,
    lieutenant,
  };
};
