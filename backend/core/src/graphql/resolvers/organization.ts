import { ObjectId } from "mongodb";
import merge from 'lodash.merge';
import { Context } from "../../utils/createContext";
import {
  UpsertOrganization,
  CheckInOutSetting,
  OrganizationFeatures,
  OrganizationFeatureOptions,
  OrganizationSearchInput,
  CreateOrganization,
} from "../../__generated__/resolvers-types";
import { adminOnly, isSuperAdmin, superAdminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { getDefaultOrg, getDefaultOrgCustomizations, getDefaultOrgFeatures, getDefaultOrgSettings, IOrganization } from "../../models/organization";

export const organization = {
  Query: {
    organization: async (
      _parent: unknown,
      _args: unknown,
      { organizations, user }: Context
    ): Promise<IOrganization | null> => organizations.get(user?.member.orgId || ''),
    organizationById: async (
      _parent: unknown,
      { orgId }: { orgId: string },
      { organizations, user }: Context
    ): Promise<IOrganization | null> => {
      superAdminOnly(user);
      return organizations.get(orgId || '');
    },
    organizations: async (
      _parent: unknown,
      { input }: { input: OrganizationSearchInput},
      { organizations, user }: Context
    ): Promise<SearchResults<IOrganization>> => {
      superAdminOnly(user);

      return organizations.search({
        limit: input.limit,
        skip: input.skip,
        queryField: input.queryField || 'name',
        order: input.order,
        orderBy: input.orderBy,
        query: input.query,
        ...(input.excludeIds && { _id: { $nin: input.excludeIds.map((id: any) => new ObjectId(id)) } }),
      });
    },
    organizationFeatures: (
      _parent: unknown,
      _args: unknown,
      _context: Context
    ): OrganizationFeatureOptions[] => {
      return [
        {
          value: 'autoEnroll',
          label: 'Auto Enroll On Login'
        },
        {
          value: 'eventCheckIn',
          label: 'Event Check In'
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
      ] as {value: (keyof OrganizationFeatures), label: string}[];
    },
    activeLottery: (
      _parent: unknown,
      _args: unknown,
      { organizations, organization }: Context
    ): boolean => organizations.activeLottery(organization!),
  },
  Mutation: {
    createOrganization: async (
      _parent: unknown,
      { organization: org }: { organization: CreateOrganization },
      { organizations, lotteryCounter, user }: Context
    ): Promise<IOrganization> => {
      superAdminOnly(user);

      const mergedOrg = {
        ...getDefaultOrg(),
        ...org,
        settings: {
          ...getDefaultOrgSettings(),
          ...(org.settings || {}),
        },
        features: {
          ...getDefaultOrgFeatures(),
          ...(org.features || {}),
        }
      };

      const res = await organizations.create(mergedOrg);

      await lotteryCounter.updateLotteryDates(res);

      await organizations.scheduleLotteryEvents(res.id, res);

      return res;
    },
    organization: async (
      _parent: unknown,
      { organization: org }: { organization: UpsertOrganization },
      { organizations, scheduler, users, lotteryCounter, user }: Context
    ): Promise<IOrganization> => {
      adminOnly(user);

      const orgId = isSuperAdmin(user) && org?.id ? new ObjectId(org?.id) : user?.member?.orgId;

      const existingOrg = await organizations.get(orgId?.toString() || '');

      if (!isSuperAdmin(user)) {
        delete org.features;
      }

      const mergedOrg: IOrganization = merge(existingOrg, org);

      if (!mergedOrg.id) {
        if (!mergedOrg.settings) {
          mergedOrg.settings = getDefaultOrgSettings();
        }
        if (!mergedOrg.features) {
          mergedOrg.features = getDefaultOrgFeatures();
        }
      };

      const res = await organizations.update(mergedOrg as any);

      await users.collection.updateMany({
        'member.orgId': mergedOrg._id,
        'member.maxShifts': { $gt: mergedOrg.settings!.shiftsPerWeek },
      }, {
        $set: {
          'member.maxShifts': mergedOrg.settings!.shiftsPerWeek,
        },
      });

      await lotteryCounter.updateLotteryDates(res);

      await organizations.scheduleLotteryEvents(orgId!, mergedOrg);

      return res;
    },
  },
  fields: {
    Organization: {
      ...commonResolvers,
      flatFeatures: (parent: IOrganization) => JSON.stringify(parent.features),
      customizations: (parent: IOrganization) => parent.customizations || getDefaultOrgCustomizations(),
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
    },
    LotteryDate: {
      time: (parent: any) => new Date(parent.time).toISOString(),
    }
  },
};
