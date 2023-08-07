import { Context } from "../..";
import { NewOrganization, Organization } from "../../__generated__/resolvers-types";
import { commonResolvers } from "../../utils/common.resolvers";

export const organization = {
  Query: {},
  Mutation: {
    organization: async (
      _parent: unknown,
      { org }: { org: NewOrganization },
      { organizations }: Context
    ): Promise<Organization> => organizations.create(org),
  },
  fields: {
    Organization: {
      ...commonResolvers,
    },
  },
};
