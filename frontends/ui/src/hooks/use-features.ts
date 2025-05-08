import { OrganizationFeatures } from "src/__generated__/resolvers-types";
import { useAuthContext } from "src/auth/hooks";

export interface IOrganizationFeatures extends OrganizationFeatures {
  docusignCheckout: boolean;
}

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
  rankHourlyRate: false,
  eventCheckOut: false,
  officerCheckInOut: false,
  callSign: false,
  eventInvoice: false,
  vehicleCategories: false,
};

export const useFeatures = (): IOrganizationFeatures => {
  const { user } = useAuthContext();

  return {
    ...user?.member?.org?.features || defaultFeatures,
    docusignCheckout: !!user?.member?.org?.docusign?.templateId,
  };
}