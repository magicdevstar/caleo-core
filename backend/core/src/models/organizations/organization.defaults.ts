import { setHours } from "date-fns";
import { DayOfWeek, MemberTier, ShiftReminderUnit } from "../../__generated__/resolvers-types";

export const org = {
  weekBegins: 'SUNDAY',
  timezone: 'America/Los_Angeles',
};

export const customizations = {
  pNumber: 'P#',
  tiers: {
    TIER_1: {
      label: 'Tier 1',
      enabled: true,
    },
    TIER_2: {
      label: 'Tier 2',
      enabled: true,
    },
    TIER_3: {
      label: 'Tier 3',
      enabled: false,
    },
    TIER_4: {
      label: 'Tier 4',
      enabled: false,
    },
  },
};

export const features = {
  lottery: false,
  venueContractDates: false,
  eventCheckIn: false,
  eventCheckOut: false,
  officerCheckInOut: false,
  interestLists: false,
  monthlyMaxHours: false,
  weeklyMaxShifts: false,
  disabledTiers: false,
  disabledTierUntil: false,
  externalEventRequests: false,
  sso: false,
  equipment: false,
  lasdEventFields: false,
  profileTenor: false,
  lasdUserFields: false,
  autoEnroll: false,
  docusign: false,
  kiosk: false,
  eventTemplates: false,
  noShowReport: false,
  rankHourlyRate: false,
  callSign: false,
  eventInvoice: false,
  vehicleCategories: false,
};

export const flatFeatures = [
  {
    value: 'autoEnroll',
    label: 'Auto Enroll On Login'
  },
  {
    value: 'eventCheckIn',
    label: 'Event Check In'
  },
  {
    value: 'eventCheckOut',
    label: 'Event Check Out'
  },
  {
    value: 'officerCheckInOut',
    label: 'Officer Check In/Out'
  },
  {
    value: 'externalEventRequests',
    label: 'External Event Requests'
  },
  {
    value: 'interestLists',
    label: 'Interest Lists'
  },
  {
    value: 'lottery',
    label: 'Lottery'
  },
  {
    value: 'monthlyMaxHours',
    label: 'Monthly Max Hours'
  },
  {
    value: 'weeklyMaxShifts',
    label: 'Weekly Max Shifts'
  },
  {
    value: 'disabledTiers',
    label: 'Disable tiers'
  },
  {
    value: 'disabledTierUntil',
    label: 'Disable tier until'
  },
  {
    value: 'venueContractDates',
    label: 'Venue Contract Dates'
  },
  {
    value: 'sso',
    label: 'SSO Login Support'
  },
  {
    value: 'equipment',
    label: 'Equipment Management and Assignment association',
  },
  {
    value: 'lasdEventFields',
    label: 'LASD Event Fields'
  },
  {
    value: 'lasdUserFields',
    label: 'LASD User Fields'
  },
  {
    value: 'docusign',
    label: 'Docusign Integration'
  },
  {
    value: 'kiosk',
    label: 'Kiosk'
  },
  {
    value: 'eventTemplates',
    label: 'Event Templates'
  },
  {
    value: 'noShowReport',
    label: 'No Show Report'
  },
  {
    value: 'rankHourlyRate',
    label: 'Rank with Hourly Rate',
  },
  {
    value: 'callSign',
    label: 'Call Sign',
  },
  {
    value: 'eventInvoice',
    label: 'Event Invoice',
  },
  {
    value: 'vehicleCategories',
    label: 'Vehicle Categories',
  },
];

const lottery = {
  enabled: false,
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
};

const shiftBuffer = {
  enabled: false,
  minuteShiftBuffer: 15,
  adminOverrideShiftBuffer: false,
};

const userRelinquishShift = {
  enabled: true,
  numberOfHoursBeforeShift: 24,
  afterShiftRemove: {
    tier: MemberTier.Tier_2,
    days: 21,
  },
  requireNoteWhenRelinquishing: true,
};

const shiftReminder = {
  enabled: true,
  time: 24,
  unit: ShiftReminderUnit.Hour,
};

const secondaryShiftReminder = {
  enabled: false,
  time: 7,
  unit: ShiftReminderUnit.Day,
};

export const settings = {
  shiftsPerWeek: 6,
  hoursPerMonth: 100,
  features,
  customizations,
  lottery,
  shiftBuffer,
  userRelinquishShift,
  shiftReminder,
  secondaryShiftReminder,
};
