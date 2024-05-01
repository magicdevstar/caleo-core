import { ObjectId } from "mongodb";
import merge from 'lodash.merge';
import { Context } from "../../utils/createContext";
import {
  UpsertOrganization,
  Organization,
  CheckInOutSetting,
  OrganizationFeatures,
  OrganizationSearchInput,
  CreateOrganization
} from "../../__generated__/resolvers-types";
import { adminOnly, isSuperAdmin, superAdminOnly } from "../../utils/access";
import { SearchResults, commonResolvers } from "../../utils/common.resolvers";
import { getDefaultOrg, getDefaultOrgFeatures, getDefaultOrgSettings } from "../../models/organization";

export const organization = {
  Query: {
    organization: async (
      _parent: unknown,
      _args: unknown,
      { organizations, user }: Context
    ): Promise<Organization | null> => organizations.get(user?.member.orgId || ''),
    organizationById: async (
      _parent: unknown,
      { orgId }: { orgId: string },
      { organizations, user }: Context
    ): Promise<Organization | null> => {
      superAdminOnly(user);
      return organizations.get(orgId || '');
    },
    organizations: async (
      _parent: unknown,
      { input }: { input: OrganizationSearchInput},
      { organizations, user }: Context
    ): Promise<SearchResults<Organization>> => {
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
    }
  },
  Mutation: {
    createOrganization: async (
      _parent: unknown,
      { organization: org }: { organization: CreateOrganization },
      { organizations, lotteryCounter, user }: Context
    ): Promise<Organization> => {
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
    ): Promise<Organization> => {
      adminOnly(user);

      const orgId = isSuperAdmin(user) && org?.id ? org?.id : user?.member?.orgId;

      const existingOrg = await organizations.get(orgId || '');

      if (!isSuperAdmin(user)) {
        delete org.features;
      }

      const mergedOrg = merge(existingOrg, org);

      if (!mergedOrg.id) {
        if (!mergedOrg.settings) {
          mergedOrg.settings = getDefaultOrgSettings();
        }
        if (!mergedOrg.features) {
          mergedOrg.features = getDefaultOrgFeatures();
        }
      };

      const res = await organizations.update(mergedOrg as any, { skipMerge: true });

      await users.collection.updateMany({
        'member.orgId': mergedOrg.id,
        'member.maxShifts': { $gt: mergedOrg.settings.shiftsPerWeek },
      }, {
        $set: {
          'member.maxShifts': mergedOrg.settings.shiftsPerWeek,
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
      defaultHoursBeforeShift: (parent: any) => parent.defaultHoursBeforeShift || 24,
      defaultNotificationTime: (parent: any) => parent.defaultNotificationTime || 24,
    },
    OrganizationFeatures: {
      lottery: (parent: OrganizationFeatures) => !!parent?.lottery,
      venueContractDates: (parent: OrganizationFeatures) => !!parent.venueContractDates,
      eventCheckIn: (parent: OrganizationFeatures) => !!parent.eventCheckIn,
      interestLists: (parent: OrganizationFeatures) => !!parent.interestLists,
      monthlyMaxHours: (parent: OrganizationFeatures) => !!parent.monthlyMaxHours,
      externalEventRequests: (parent: OrganizationFeatures) => !!parent.externalEventRequests,
      eventRequests: (parent: OrganizationFeatures) => !!parent.eventRequests,
    },
    LotteryDate: {
      time: (parent: any) => new Date(parent.time).toISOString(),
    }
  },
};
