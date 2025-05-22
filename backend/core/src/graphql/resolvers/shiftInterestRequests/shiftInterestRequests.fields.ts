import { IShiftInterestRequest } from "../../../models/shiftInterestRequest";
import { EnhancedUser } from "../../../types/common";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  ShiftInterestRequest: {
    ...commonResolvers,
    org: (item: IShiftInterestRequest, _, { organizations }: Context) => organizations.loader.load(item.orgId.toString()),
    event: (item: IShiftInterestRequest, _, { events }: Context) => events.loader.load(item.eventId.toString()),
    assignment: (item: IShiftInterestRequest, _, { assignments }: Context) => assignments.loader.load(item.assignmentId.toString()),
    user: async (
      item: IShiftInterestRequest,
      {
        shiftStart,
        timezoneOffset,
        ignoreShiftId
      }: {
        shiftStart: string;
        timezoneOffset: number;
        ignoreShiftId: string;
      },
      { users }: Context
    ): Promise<EnhancedUser> => {
      const user = await users.loader.load(item.userId.toString());
      return {
        ...user!,
        shiftStart,
        ignoreShiftId,
        timezoneOffset,
      };
    },
    shift: (item: IShiftInterestRequest, _, { shifts }: Context) => shifts.loadOneShiftFromGroup.load(item.shiftGroupId),
    assignedShift: (item: IShiftInterestRequest, _, { shifts }: Context) => item.assignedShiftId ? shifts.loader.load(item.assignedShiftId.toString()) : null,
  },
};
