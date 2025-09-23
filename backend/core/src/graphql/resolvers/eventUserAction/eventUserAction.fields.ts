import { EventUserActionType } from "../../../__generated__/resolvers-types";
import { IEventUserAction } from "../../../models/eventUserActions/eventUserAction.entity";
import { Context } from "../../../utils/createContext";

export const fields = {
  EventUserAction: {
    actionType: (parent: IEventUserAction) => {
      if (parent.incidentFormId) {
        return EventUserActionType.IncidentSubmission;
      }
      return EventUserActionType.Shift;
    },
    user: (parent: IEventUserAction, _args, { users }: Context) => users.loader.load(parent.userId.toString()),
    modifiedBy: (parent: IEventUserAction, _args, { users }: Context) => {
      if (parent.modifiedBy) {
        return parent.modifiedBy;
      }
      if (parent.modifiedById) {
        return users.loader.load(parent.modifiedById.toString());
      }
      return null;
    },
    event: (parent: IEventUserAction, _args, { events }: Context) => events.loader.load(parent.eventId.toString()),
    shifts: (parent: IEventUserAction, _args, { shifts }: Context) => {
      return parent.shiftGroupId ? shifts.loadUserShiftsByGroupId.load({
        userId: parent.userId.toString(),
        shiftId: parent.shiftGroupId,
      }) : null
    },
    shiftInterestRequests: (parent: IEventUserAction, _args, { shiftInterestRequests, user }: Context) =>
      parent.shiftGroupId ? shiftInterestRequests.loadAll.load({
        userId: parent.userId.toString(),
        orgId: user.member.orgId.toString(),
        shiftGroupId: parent.shiftGroupId,
      }) : null,
    shiftLotteryRequests: (parent: IEventUserAction, _args, { shiftLotteryRequests, user }: Context) =>
      parent.shiftGroupId ? shiftLotteryRequests.requestLoader.load({
        userId: parent.userId.toString(),
        orgId: user.member.orgId.toString(),
        shiftGroupId: parent.shiftGroupId,
      }) : null,
    incidentForm: (parent: IEventUserAction, _args, { incidentSubmissionModel }: Context) =>
      parent.incidentFormId ? incidentSubmissionModel.loader.load(parent.incidentFormId.toString()) : null,
  },
};