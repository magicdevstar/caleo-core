import { IShiftLotteryRequest } from "../../../models/shiftLotteryRequest";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  ShiftLotteryRequest: {
    ...commonResolvers,
    org: (item: IShiftLotteryRequest, _, { organizations }: Context) => organizations.loader.load(item.orgId.toString()),
    event: (item: IShiftLotteryRequest, _, { events }: Context) => events.loader.load(item.eventId.toString()),
    assignment: (item: IShiftLotteryRequest, _, { assignments }: Context) => assignments.loader.load(item.assignmentId.toString()),
    user: async (item: IShiftLotteryRequest, {shiftStart, timezoneOffset}: {shiftStart: string; timezoneOffset: number;}, { users }: Context) => {
      const user = await users.loader.load(item.userId.toString());
      return {
        ...user,
        shiftStart,
        timezoneOffset,
      };
    },
    shift: (item: IShiftLotteryRequest, _, { shifts }: Context) => shifts.loadOneShiftFromGroup.load(item.shiftGroupId),
  },
};
