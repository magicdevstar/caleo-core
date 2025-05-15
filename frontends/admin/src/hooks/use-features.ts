import { OrganizationFeatures } from 'src/__generated__/resolvers-types';
import { useAuthContext } from 'src/auth/hooks';

const defaultFeatures: OrganizationFeatures = {
  eventCheckIn: false,
  lottery: false,
  interestLists: false,
  venueContractDates: false,
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
  eventCheckOut: false,
  officerCheckInOut: false,
  rankHourlyRate: false,
  callSign: false,
  eventInvoice: false,
  vehicleCategories: false,
  rankGrouping: false,
};

export const useFeatures = (): OrganizationFeatures => {
  const { user } = useAuthContext();

  return user.member.org?.features || defaultFeatures;
};
