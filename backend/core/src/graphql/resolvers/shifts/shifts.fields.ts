import { Context } from "../../../utils/createContext";
import { commonResolvers } from "../../../utils/common.resolvers";
import { IShift, IShiftCheckInOut, IShiftCheckInOutEquipment } from "../../../models/shift";
import { EventUserActionLogAction } from "../../../__generated__/resolvers-types";
import { docusignDates } from "../../../utils/date.helpers";

export const fields = {
  Shift: {
    ...commonResolvers,
    customId: (item: IShift) => item.customId ? item.customId : `${item.refNumber}`,
    createdBy: (shift: IShift, _: unknown, { users }: Context) => shift.createdById ? users.loader.load(shift.createdById.toString()) : null,
    org: (shift: IShift, _: unknown, { organizations }: Context) => organizations.loader.load(shift.orgId.toString()),
    event: (shift: IShift, _: unknown, { events }: Context) => events.loader.load(shift.eventId.toString()),
    assignment: (shift: IShift, _: unknown, { assignments }: Context) => assignments.loader.load(shift.assignmentId.toString()),
    startTime: (item: IShift) => new Date(item.startTime).toISOString(),
    endTime: (item: IShift) => new Date(item.endTime).toISOString(),
    user: (shift: IShift, _: unknown, { users }: Context) => shift.userId ? users.loader.load(shift.userId.toString()) : null,
    shiftInterestRequest: (shift: IShift, _: unknown, { shiftInterestRequests, user, organization }: Context) =>
      shiftInterestRequests.requestLoader.load({
        userId: user.id!,
        orgId: organization.id!,
        shiftGroupId: shift.shiftId,
      }),
    lotteryRequest: (shift: IShift, _: unknown, { shiftLotteryRequests, user, organization }: Context) =>
      shiftLotteryRequests.requestLoader.load({
        userId: user._id!.toString()!,
        orgId: organization._id!.toString()!,
        shiftGroupId: shift.shiftId,
      }),
    otherShiftSlots: (
      shift: IShift,
      _: unknown,
      { shifts }: Context
    ) => shifts.loadOtherShiftSlots.load(shift.shiftId),
    docusignEvent: (item: IShift, _: unknown, context: Context) => {
      if (!item.docusignEnvelopeId) return null;
      return context.docusign.loadEventsByShiftId((item.id?.toString() || item._id?.toString())!);
    },
    docusignEvents: (item: IShift, _: unknown, context: Context) => {
      return context.docusign.loadAllEventsByShiftId((item.id?.toString() || item._id?.toString())!);
    },
    shiftComment: (shift: IShift, _: unknown, { shifts }: Context) =>
      shifts.loadCommentsById.load(shift.id || shift._id!.toString()),
    hasComments: (shift: IShift, _: unknown, context: Context) => {
      if (!!shift.shiftCheckInOut?.adminNotes) return true;
      if (!shift.userId) return false;
      return context.eventUserActions.loadHasActionsForShifts.load({ shiftId: shift.shiftId, userId: shift.userId, action: EventUserActionLogAction.OfficerCommentAdded });
    },
    calculatedShiftDetails: async (shift: IShift, _: unknown, { organization, assignments }: Context) => {
      const assignment = await assignments.loader.load(shift.assignmentId.toString());
      return docusignDates({
        startTime: shift.shiftCheckInOut?.checkInTime || shift.startTime,
        endTime: shift.shiftCheckInOut?.checkOutTime || shift.endTime,
        startEquipmentTime: shift.shiftCheckInOut?.equipmentDetails?.checkInTime,
        endEquipmentTime: shift.shiftCheckInOut?.equipmentDetails?.checkOutTime,
        timezone: organization.timezone as any,
        includeDriveTime: !!assignment?.includeDriveTime,
      });
    }
  },
  ShiftCheckInOut: {
    checkInTime: (item: IShiftCheckInOut) => item.checkInTime ? new Date(item.checkInTime).toISOString() : null,
    checkOutTime: (item: IShiftCheckInOut) => item.checkOutTime ? new Date(item.checkOutTime).toISOString() : null,
  },
  ShiftCheckInOutEquipment: {
    checkInTime: (item: IShiftCheckInOutEquipment) => item.checkInTime ? new Date(item.checkInTime).toISOString() : null,
    checkOutTime: (item: IShiftCheckInOutEquipment) => item.checkOutTime ? new Date(item.checkOutTime).toISOString() : null,
    vehicleCategory: (item: IShiftCheckInOutEquipment, _: unknown, { vehicleCategories }: Context) => item.vehicleCategoryId ? vehicleCategories.loader.load(item.vehicleCategoryId.toString()) : null,
  },
};