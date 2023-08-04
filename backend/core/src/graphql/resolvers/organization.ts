import { Context } from "../..";
import { NewOrganization, Organization } from "../../__generated__/resolvers-types";

export const organization = {
  Query: {},
  Mutation: {
    organization: async (
      _parent: unknown,
      { org }: { org: NewOrganization },
      { organizations }: Context
    ): Promise<Organization> => organizations.createOrganization(org),
  },
  fields: {
    Organization: {
      createdAt: (org) => new Date(org.createdAt).toISOString(),
      updatedAt: (org) => new Date(org.createdAt).toISOString(),
    },
  },
};
