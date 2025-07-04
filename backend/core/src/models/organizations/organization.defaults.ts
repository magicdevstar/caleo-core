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
  dateFormats: {
    dateTime: 'ddd DD MMM YYYY HH:mm',
    date: 'ddd DD MMM YYYY',
    miniDate: 'MM/DD/YYYY',
    time: 'HH:mm',
  },
};

// Define features as a single source of truth
export const featureDefinitions = [
  { value: 'autoEnroll', label: 'Auto Enroll On Login', defaultEnabled: false },
  { value: 'eventCheckIn', label: 'Event Check In', defaultEnabled: false },
  { value: 'eventCheckOut', label: 'Event Check Out', defaultEnabled: false },
  { value: 'officerCheckInOut', label: 'Officer Check In/Out', defaultEnabled: false },
  { value: 'externalEventRequests', label: 'External Event Requests', defaultEnabled: false },
  { value: 'interestLists', label: 'Interest Lists', defaultEnabled: false },
  { value: 'lottery', label: 'Lottery', defaultEnabled: false },
  { value: 'monthlyMaxHours', label: 'Monthly Max Hours', defaultEnabled: false },
  { value: 'weeklyMaxShifts', label: 'Weekly Max Shifts', defaultEnabled: false },
  { value: 'disabledTiers', label: 'Disable tiers', defaultEnabled: false },
  { value: 'disabledTierUntil', label: 'Disable tier until', defaultEnabled: false },
  { value: 'venueContractDates', label: 'Venue Contract Dates', defaultEnabled: false },
  { value: 'sso', label: 'SSO Login Support', defaultEnabled: false },
  { value: 'equipment', label: 'Equipment Management and Assignment association', defaultEnabled: false },
  { value: 'lasdEventFields', label: 'LASD Event Fields', defaultEnabled: false },
  { value: 'lasdUserFields', label: 'LASD User Fields', defaultEnabled: false },
  { value: 'docusign', label: 'Docusign Integration', defaultEnabled: false },
  { value: 'kiosk', label: 'Kiosk', defaultEnabled: false },
  { value: 'eventTemplates', label: 'Event Templates', defaultEnabled: false },
  { value: 'noShowReport', label: 'No Show Report', defaultEnabled: false },
  { value: 'rankHourlyRate', label: 'Rank with Hourly Rate', defaultEnabled: false },
  { value: 'callSign', label: 'Call Sign', defaultEnabled: false },
  { value: 'eventInvoice', label: 'Event Invoice', defaultEnabled: false },
  { value: 'vehicleCategories', label: 'Vehicle Categories', defaultEnabled: false },
  { value: 'rankGrouping', label: 'Rank Grouping', defaultEnabled: false },
  { value: 'endOfShiftPDF', label: 'End of Shift PDF (Warning! Template upload required.)', defaultEnabled: false },
  { value: 'docusignCheckout', label: 'Docusign Checkout (Required docusign template ids)', defaultEnabled: false },
  { value: 'customizableShiftId', label: 'Customizable Shift id', defaultEnabled: false },
  { value: 'incidentEvents', label: 'Enable incident events', defaultEnabled: false },
  { value: 'outsideUserList', label: 'CSV Upload for outside users', defaultEnabled: false },
  { value: 'signingAuthorityAssignment', label: 'Signing Authority Assignment', defaultEnabled: false },
  { value: 'financeUnit', label: 'Finance Unit', defaultEnabled: false },
];

// Generate features object from featureDefinitions
export const features = featureDefinitions.reduce((acc, feature) => {
  acc[feature.value] = feature.defaultEnabled;
  return acc;
}, {} as Record<string, boolean>);

// Generate flatFeatures array from featureDefinitions
export const flatFeatures = featureDefinitions.map(({ value, label }) => ({ value, label }));

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
