import { ObjectId } from "mongodb";
import { Context } from "../../../utils/createContext";
import {
  AvailableShiftsSearchInput,
  EventStatus,
  ShiftSearchInput,
  ShiftTabResponse,
} from "../../../__generated__/resolvers-types";
import { adminOnly } from "../../../utils/access";
import { SearchResults } from "../../../utils/common.resolvers";
import { IUserSearchResult } from "../../../types/common";
import { IShift } from "../../../models/shift";
import { IFinanceShift } from "../../../services/finance.service";

export const Query = {
  financeShifts: async (
    _parent: unknown,
    { eventId }: { eventId: ObjectId },
    { finance, user, organization }: Context
  ): Promise<IFinanceShift[]> => {
    adminOnly(user);

    return finance.get(eventId, organization);
  },
  shiftTabs: async (
    _parent: unknown,
    { id }: { id: string },
    { docusign, user, organization }: Context
  ): Promise<ShiftTabResponse | null> => {
    adminOnly(user);

    const { tabs, templateName } = await docusign.getTabs({ shiftId: id, organization });

    return {
      orgId: user.member.orgId.toString(),
      templateName: templateName || 'shift-close',
      data: JSON.stringify(tabs),
    };
  },
  availableShifts: async (
    _parent: unknown,
    { input: { upcoming } }: {input: AvailableShiftsSearchInput},
    { users, user, organization }: Context
  ): Promise<SearchResults<IShift>> =>
    users.availableShifts({
      user: user!,
      organization: organization!,
      upcoming: !!upcoming,
      eventTypes: [
        EventStatus.FirstComeFirstServe,
        EventStatus.InterestList,
      ],
    }),
  shift: async (
    _parent: unknown,
    { id }: { id: string },
    { shifts }: Context,
  ): Promise<IShift | null> => shifts.get(id),
  groupedShifts: async (
    _parent: unknown,
    { shiftId }: { shiftId: string },
    { shifts, user }: Context,
  ): Promise<IShift[] | null> => {
    const { items } = await shifts.search({
      shiftId,
      orgId: user.member.orgId,
      order: 'asc',
      orderBy: 'refNumber',
    });
    return items;
  },
  lotteryShifts: async (
    _parent: unknown,
    _: unknown,
    { users, user, organization }: Context
  ): Promise<SearchResults<IShift>> => users.availableShifts({
    user: user!,
    organization: organization!,
    upcoming: false,
    eventTypes: [EventStatus.ReadyForLottery],
  }),
  shifts: async (
    _parent: unknown,
    { input }: { input: ShiftSearchInput },
    { shifts, user, users }: Context
  ): Promise<SearchResults<IShift>> => {
    const convertedUser = users.convertToModel(user as any);
    return shifts.dynamicSearch({
      orgId: new ObjectId(convertedUser!.member.orgId),
      requestingUser: convertedUser!,
      ...input,
    });
  },
  shiftUsers: async (
    _parent: unknown,
    { id, name }: { id: string, name?: string },
    { users, user }: Context
  ): Promise<IUserSearchResult> => {
    adminOnly(user);

    const filters: { name?: string } = {};
    if (name && name.trim() !== '') {
      filters.name = name;
    }

    return users.findCompatibleUsersForShift({
      id,
      orgId: user.member.orgId,
      filters,
    });
  }
};
