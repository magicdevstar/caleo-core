import { Context } from "../../../utils/createContext";
import {
  OrganizationFeatureOptions,
  OrganizationSearchInput,
} from "../../../__generated__/resolvers-types";
import { adminOnly, superAdminOnly } from "../../../utils/access";
import { SearchResults } from "../../../utils/common.resolvers";
import { IOrganization } from "../../../models/organizations/organization.entity";
import { flatFeatures } from "../../../models/organizations/organization.defaults";

export const Query = {
  organization: async (
    _parent: unknown,
    _args: unknown,
    { organizations, user }: Context
  ): Promise<IOrganization | null> =>
    organizations.get(user?.member.orgId || ''),
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
    return organizations.search(input);
  },
  organizationFeatures: (
    _parent: unknown,
    _args: unknown,
    { user }: Context
  ): OrganizationFeatureOptions[] => {
    adminOnly(user);
    return flatFeatures;
  },
  activeLottery: (
    _parent: unknown,
    _args: unknown,
    { organizations, organization }: Context
  ): boolean => organizations.activeLottery(organization!),
};
