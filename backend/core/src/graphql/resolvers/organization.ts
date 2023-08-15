import { setHours } from "date-fns";
import { Context } from "../..";
import { UpsertOrganization, Organization, DayOfWeek, MemberTier, ShiftReminderUnit } from "../../__generated__/resolvers-types";
import { adminOnly } from "../../utils/access";
import { commonResolvers } from "../../utils/common.resolvers";

export const organization = {
  Query: {
    organization: async (
      _parent: unknown,
      _args: unknown,
      { organizations, user }: Context
    ): Promise<Organization | null> => organizations.get(user?.member.orgId || ''),
  },
  Mutation: {
    organization: async (
      _parent: unknown,
      { organization: org }: { organization: UpsertOrganization },
      { organizations, user }: Context
    ): Promise<Organization> => {
      adminOnly(user);

      if (!org.id && !org.settings) {
        org.settings = {
          shiftsPerWeek: 6,
          lottery: {
            enabled: true,
            notifyUsersBeforeClose: 24,
            fcfsShiftsDelay: 1,
            open: {
              dayOfWeek: DayOfWeek.Friday,
              time: setHours(new Date(0), 18).getTime() as any,
            },
            close: {
              dayOfWeek: DayOfWeek.Monday,
              time: setHours(new Date(0), 6).getTime() as any,
            }
          },
          shiftBuffer: {
            enabled: false,
            minuteShiftBuffer: 15,
            adminOverrideShiftBuffer: false,
          },
          userRelinquishShift: {
            enabled: true,
            afterShiftRemove: {
              tier: MemberTier.Tier_2,
              days: 21,
            },
            requireNoteWhenRelinquishing: true,
          },
          shiftReminder: {
            enabled: true,
            time: 24,
            unit: ShiftReminderUnit.Hour,
          },
        }
      }

      return organizations.upsert(org as any);
    },
  },
  fields: {
    Organization: {
      ...commonResolvers,
    },
    LotteryDate: {
      time: (parent: any) => new Date(parent.time).toISOString(),
    }
  },
};
