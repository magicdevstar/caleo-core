import { setHours, addDays } from "date-fns";
import { DayOfWeek, MemberTier, ShiftReminderUnit } from "./src/__generated__/resolvers-types";

console.log(JSON.stringify({
  shiftsPerWeek: 6,
  lottery: {
    enabled: true,
    notifyUsersBeforeClose: 24,
    fcfsShiftsDelay: 1,
    open: {
      dayOfWeek: DayOfWeek.Friday,
      time: setHours(addDays(new Date(0), 2), 18).getTime() as any,
    },
    close: {
      dayOfWeek: DayOfWeek.Monday,
      time: setHours(addDays(new Date(0), 2), 6).getTime() as any,
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
}, null, 2));