import { ObjectId } from "mongodb";
import merge from 'lodash.merge';
import { Context } from "../../../utils/createContext";
import {
  UpsertOrganization,
  CreateOrganization,
  OrganizationFeatures,
} from "../../../__generated__/resolvers-types";
import { adminOnly, isSuperAdmin, superAdminOnly } from "../../../utils/access";
import {
  org as defaultOrg,
  features,
  settings,
} from '../../../models/organizations/organization.defaults';
import { IOrganization } from "../../../models/organizations/organization.entity";

export const Mutation = {
  createOrganization: async (
    _parent: unknown,
    { organization: org }: { organization: CreateOrganization },
    { organizations, lotteryCounter, user }: Context
  ): Promise<IOrganization> => {
    superAdminOnly(user);

    const mergedOrg = {
      ...defaultOrg,
      ...org,
      settings: {
        ...settings,
        ...(org.settings || {}),
      },
      features: {
        ...features,
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
    { organizations, users, lotteryCounter, user }: Context
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
        mergedOrg.settings = settings;
      }
      if (!mergedOrg.features) {
        mergedOrg.features = features as unknown as OrganizationFeatures;
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
};
