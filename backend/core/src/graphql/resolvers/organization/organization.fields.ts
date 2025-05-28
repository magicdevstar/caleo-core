import {
  CheckInOutSetting,
  OrganizationCustomizations,
  OrganizationDateFormats,
  OrganizationFeatures,
} from "../../../__generated__/resolvers-types";
import { commonResolvers } from "../../../utils/common.resolvers";
import { IOrganization } from "../../../models/organizations/organization.entity";
import { customizations } from "../../../models/organizations/organization.defaults";

export const fields = {
  Organization: {
    ...commonResolvers,
    flatFeatures: (parent: IOrganization) => JSON.stringify(parent.features),
    customizations: (parent: IOrganization) => parent.customizations || customizations,
  },
  OrganizationCustomizations: {
    dateFormats: (parent: OrganizationCustomizations) => parent.dateFormats || customizations.dateFormats,
  },
  OrganizationDateFormats: {
    dateTime: (parent: OrganizationDateFormats) => parent.dateTime || customizations.dateFormats.dateTime,
    date: (parent: OrganizationDateFormats) => parent.date || customizations.dateFormats.date,
    miniDate: (parent: OrganizationDateFormats) => parent.miniDate || customizations.dateFormats.miniDate,
    time: (parent: OrganizationDateFormats) => parent.time || customizations.dateFormats.time,
  },
  OrganizationOvertimeSettings: {
    hoursPerMonth: (parent: any) => parent.hoursPerMonth || 100,
    interestList: (parent: any) => parent.interestList || {},
    // Setting defaults for check in/out
    checkInOut: ({ checkInOut }: any) => {
      const {
        minutesAfterShiftEnd = 60 * 6,
        minutesBeforeShiftStart = 15
      }: CheckInOutSetting = checkInOut || {
        minutesAfterShiftEnd: 60 * 6,
        minutesBeforeShiftStart: 15,
      };
      return {
        minutesAfterShiftEnd,
        minutesBeforeShiftStart,
      };
    },
  },
  InterestListSetting: {
    // This is the number of hours before event start that the interest list begins
    // auto assigning shifts.
    defaultHoursBeforeShift: (parent: any) => parent.defaultHoursBeforeShift || 24,
    // Number of days before auto hiring is disabled. This is the default value but
    // can be changed per event.
    defaultAutoHireCutoff: (parent: any) => parent.defaultAutoHireCutoff || 7,
    // the Number of hours before auto assignment that the reminder notification is sent
    // to qualified users.
    defaultNotificationTime: (parent: any) => parent.defaultNotificationTime || 24,
  },
  OrganizationFeatures: {
    lottery: (parent: OrganizationFeatures) => !!parent?.lottery,
    venueContractDates: (parent: OrganizationFeatures) => !!parent.venueContractDates,
    eventCheckIn: (parent: OrganizationFeatures) => !!parent.eventCheckIn,
    eventCheckOut: (parent: OrganizationFeatures) => !!parent.eventCheckOut,
    officerCheckInOut: (parent: OrganizationFeatures) => !!parent.officerCheckInOut,
    interestLists: (parent: OrganizationFeatures) => !!parent.interestLists,
    monthlyMaxHours: (parent: OrganizationFeatures) => !!parent.monthlyMaxHours,
    weeklyMaxShifts: (parent: OrganizationFeatures) => !!parent.weeklyMaxShifts,
    disabledTiers: (parent: OrganizationFeatures) => !!parent.disabledTiers,
    disabledTierUntil: (parent: OrganizationFeatures) => !!parent.disabledTierUntil,
    externalEventRequests: (parent: OrganizationFeatures) => !!parent.externalEventRequests,
    sso: (parent: OrganizationFeatures) => !!parent.sso,
    equipment: (parent: OrganizationFeatures) => !!parent.equipment,
    lasdEventFields: (parent: OrganizationFeatures) => !!parent.lasdEventFields,
    profileTenor: (parent: OrganizationFeatures) => !!parent.profileTenor,
    lasdUserFields: (parent: OrganizationFeatures) => !!parent.lasdUserFields,
    autoEnroll: (parent: OrganizationFeatures) => !!parent.autoEnroll,
    docusign: (parent: OrganizationFeatures) => !!parent.docusign,
    kiosk: (parent: OrganizationFeatures) => !!parent.kiosk,
    eventTemplates: (parent: OrganizationFeatures) => !!parent.eventTemplates,
    noShowReport: (parent: OrganizationFeatures) => !!parent.noShowReport,
    rankHourlyRate: (parent: OrganizationFeatures) => !!parent.rankHourlyRate,
    callSign: (parent: OrganizationFeatures) => !!parent.callSign,
    eventInvoice: (parent: OrganizationFeatures) => !!parent.eventInvoice,
    vehicleCategories: (parent: OrganizationFeatures) => !!parent.vehicleCategories,
    rankGrouping: (parent: OrganizationFeatures) => !!parent.rankGrouping,
    endOfShiftPDF: (parent: OrganizationFeatures) => !!parent.endOfShiftPDF,
    docusignCheckout: (parent: OrganizationFeatures) => !!parent.docusignCheckout,
  },
  LotteryDate: {
    time: (parent: any) => new Date(parent.time).toISOString(),
  }
};
