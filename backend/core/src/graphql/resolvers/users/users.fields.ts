import { startOfWeek } from "date-fns/startOfWeek";
import { endOfWeek } from "date-fns/endOfWeek";
import { startOfMonth } from "date-fns/startOfMonth";
import { endOfMonth } from "date-fns/endOfMonth";
import { addHours } from "date-fns/addHours";
import { toZonedTime } from "date-fns-tz";
import { EnhancedUser, IMember, IUser } from "../../../types/common";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";
import logger from "../../../utils/logger";

export const fields = {
  User: {
    ...commonResolvers,
    image: (user: IUser, _, { users }: Context) => user.imagePath ? users.getDownloadUrl(user.imagePath!) : null,
    shiftsThisWeek: (parent: EnhancedUser, _: any, { shifts }: Context) => {
      logger.info('Shifts this week', { parent });
      if (!parent.shiftStart || !parent.timezoneOffset) {
        return null;
      }
      const beginningOfWeek = addHours(startOfWeek(new Date(parent.shiftStart), { weekStartsOn: 1 }), parent.timezoneOffset || 0);
      const endOfTheWeek = addHours(endOfWeek(new Date(parent.shiftStart), { weekStartsOn: 1 }), parent.timezoneOffset || 0);
      return shifts.weekShiftsLoader.load({
        id: parent._id!.toString()!,
        orgId: parent.member.orgId.toString(),
        beginningOfWeek,
        endOfWeek: endOfTheWeek,
      });
    },
    numberOfHoursThisMonth: (parent: EnhancedUser, _args: any, { shifts, organization }: Context) => {
      if (!parent.shiftStart) {
        return null;
      }

      const zonedStart = toZonedTime(parent.shiftStart, organization!.timezone!);
      const beginningOfMonth = startOfMonth(zonedStart);
      const endOfTheMonth = endOfMonth(zonedStart);

      return shifts.shiftHoursLoader.load({
        id: parent._id!.toString()!,
        orgId: parent.member.orgId.toString(),
        beginningOfMonth,
        endOfMonth: endOfTheMonth,
        ignoreShiftId: parent.ignoreShiftId,
      });
    },
    numberOfShiftsThisWeek: (parent: EnhancedUser, _args: any, { shifts }: Context) => {
      if (!parent.shiftStart || !parent.timezoneOffset) {
        return null;
      }
      const beginningOfWeek = addHours(startOfWeek(new Date(parent.shiftStart), { weekStartsOn: 1 }), parent.timezoneOffset || 0);
      const endOfTheWeek = addHours(endOfWeek(new Date(parent.shiftStart), { weekStartsOn: 1 }), parent.timezoneOffset || 0);
      return shifts.shiftCountLoader.load({
        id: parent._id!.toString()!,
        orgId: parent.member.orgId.toString(),
        beginningOfWeek,
        endOfWeek: endOfTheWeek,
      });
    },
    browserNotificationSettings: (user: IUser, _, { browserNotificationSubscriptions }: Context) => browserNotificationSubscriptions.userIdLoader.load(user._id!),
  },
  Member: {
    startDate: (member: IMember) => member.startDate ? new Date(member.startDate).toISOString() : null,
    rank: async (member: IMember, _, { ranks }: Context) => {
      const result = await (member.rankId ? ranks.loader.load(member.rankId.toString()) : null);
      logger.info('Member rank', { member, result, rankId: member?.rankId?.toString() });
      return result;
    },
    unit: async (member: IMember, _, { unit }: Context) => {
      const result = await (member.unitId ? unit.loader.load(member.unitId.toString()) : null);
      logger.info('Member unit', { member, result, unitId: member?.unitId?.toString() });
      return result;
    },
    division: async (member: IMember, _, { division }: Context) => {
      const result = await (member.divisionId ? division.loader.load(member.divisionId.toString()) : null);
      logger.info('Member division', { member, result, divisionId: member?.divisionId?.toString() });
      return result;
    },
    memberSkills: (member: IMember, _, { memberSkills }: Context) => {
      if (Array.isArray(member.memberSkillIds) && member.memberSkillIds.length > 0) {
        return memberSkills.loader.loadMany(member.memberSkillIds.map((id) => id?.toString()) as string[]);
      }
      return [];
    },
    memberEquipments: (member: IMember, _, { memberEquipments }: Context) => {
      if (Array.isArray(member.memberEquipmentIds) && member.memberEquipmentIds.length > 0) {
        return memberEquipments.loader.loadMany(member.memberEquipmentIds.map((id) => id?.toString()) as string[]);
      }
      return [];
    },
    tierUntil: (member: IMember) => member.tierUntil ? new Date(member.tierUntil).toISOString() : null,
    tenor: (member: IMember) => member.tenor ? new Date(member.tenor).toISOString() : null,
    inactivateUntil: (member: IMember) => member.inactivateUntil ? new Date(member.inactivateUntil).toISOString() : null,
    org: async (member: IMember, _, { organizations }: Context) => {
      const result = await organizations.loader.load(member.orgId.toString());
      logger.info('Member org', { member, result, orgId: member.orgId.toString() });
      return result;
    },
    allowSelfCheckIn: (member: IMember) => 'allowSelfCheckIn' in member ? member.allowSelfCheckIn : true,
  },
};
