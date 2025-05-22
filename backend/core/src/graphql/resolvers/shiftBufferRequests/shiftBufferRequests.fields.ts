import { IShiftBufferRequest } from "../../../models/shiftBufferRequest";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  ShiftBufferRequest: {
    ...commonResolvers,
    startTime: (item: IShiftBufferRequest) => new Date(item.startTime).toISOString(),
    endTime: (item: IShiftBufferRequest) => new Date(item.endTime).toISOString(),
    org: (item: IShiftBufferRequest, _, { organizations }: Context) => organizations.loader.load(item.orgId.toString()),
    event: (item: IShiftBufferRequest, _, { events }: Context) => events.loader.load(item.eventId.toString()),
    assignment: (item: IShiftBufferRequest, _, { assignments }: Context) => assignments.loader.load(item.assignmentId.toString()),
    user: (item: IShiftBufferRequest, _, { users }: Context) => users.loader.load(item.userId.toString()),
    shift: (item: IShiftBufferRequest, _, { shifts }: Context) => shifts.loader.load(item.shiftId.toString()),
    shiftBufferShift: (item: IShiftBufferRequest, _, { shifts }: Context) => shifts.loader.load(item.shiftBufferShiftId.toString()),
  },
};
