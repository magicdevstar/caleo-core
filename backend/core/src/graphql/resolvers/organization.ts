import { Context } from "../..";
import { NewOrganization, Organization } from "../../__generated__/resolvers-types";
import logger from "../../utils/logger";

export const organization = {
  Mutation: {
    organization: async (
      _parent: unknown,
      { org }: { org: NewOrganization },
      { organizations }: Context
    ): Promise<Organization> => organizations.createOrganization(org),
  },
};
