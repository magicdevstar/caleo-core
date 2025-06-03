import { Context } from "../../../utils/createContext";
import { commonResolvers } from "../../../utils/common.resolvers";
import { IShift, IShiftCheckInOut, IShiftCheckInOutEquipment } from "../../../models/shift";

export const fields = {
  Shift: {
    ...commonResolvers,
    customId: (item: IShift) => item.customId ? item.customId : `${item.refNumber}`,
    createdBy: (shift: IShift, _, { users }: Context) => shift.createdById ? users.loader.load(shift.createdById.toString()) : null,
    org: (shift: IShift, _, { organizations }: Context) => organizations.loader.load(shift.orgId.toString()),
    event: (shift: IShift, _, { events }: Context) => events.loader.load(shift.eventId.toString()),
    assignment: (shift: IShift, _, { assignments }: Context) => assignments.loader.load(shift.assignmentId.toString()),
    startTime: (item: IShift) => new Date(item.startTime).toISOString(),
    endTime: (item: IShift) => new Date(item.endTime).toISOString(),
    user: (shift: IShift, _, { users }: Context) => shift.userId ? users.loader.load(shift.userId.toString()) : null,
    shiftInterestRequest: (shift: IShift, _, { shiftInterestRequests, user, organization }: Context) =>
      shiftInterestRequests.requestLoader.load({
        userId: user.id!,
        orgId: organization.id!,
        shiftGroupId: shift.shiftId,
      }),
    lotteryRequest: (shift: IShift, _, { shiftLotteryRequests, user, organization }: Context) =>
      shiftLotteryRequests.requestLoader.load({
        userId: user._id!.toString()!,
        orgId: organization._id!.toString()!,
        shiftGroupId: shift.shiftId,
      }),
    otherShiftSlots: (
      shift: IShift,
      _,
      { shifts }: Context
    ) => shifts.loadOtherShiftSlots.load(shift.shiftId),
    docusignEvent: (item: IShift, _, context: Context) => {
      if (!item.docusignEnvelopeId) return null;
      return context.docusign.loadEventsByShiftId((item.id?.toString() || item._id?.toString())!);
    },
  },
  ShiftCheckInOut: {
    checkInTime: (item: IShiftCheckInOut) => item.checkInTime ? new Date(item.checkInTime).toISOString() : null,
    checkOutTime: (item: IShiftCheckInOut) => item.checkOutTime ? new Date(item.checkOutTime).toISOString() : null,
  },
  ShiftCheckInOutEquipment: {
    checkInTime: (item: IShiftCheckInOutEquipment) => item.checkInTime ? new Date(item.checkInTime).toISOString() : null,
    checkOutTime: (item: IShiftCheckInOutEquipment) => item.checkOutTime ? new Date(item.checkOutTime).toISOString() : null,
    vehicleCategory: (item: IShiftCheckInOutEquipment, _, { vehicleCategories }: Context) => item.vehicleCategoryId ? vehicleCategories.loader.load(item.vehicleCategoryId.toString()) : null,
  }
};