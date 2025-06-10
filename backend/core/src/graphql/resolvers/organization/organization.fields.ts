import {
  CheckInOutSetting,
  OrganizationCustomizations,
  OrganizationDateFormats,
  OrganizationFeatures,
} from "../../../__generated__/resolvers-types";
import { commonResolvers } from "../../../utils/common.resolvers";
import { IOrganization } from "../../../models/organizations/organization.entity";
import { customizations, featureDefinitions } from "../../../models/organizations/organization.defaults";

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
  OrganizationFeatures: featureDefinitions.reduce((acc, { value: key }) => ({
    ...acc,
    [key]: (parent: OrganizationFeatures) => !!parent[key],
  }), {}),
  LotteryDate: {
    time: (parent: any) => new Date(parent.time).toISOString(),
  }
};
