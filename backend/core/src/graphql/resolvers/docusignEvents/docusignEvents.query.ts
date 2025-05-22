import { GraphQLError } from "graphql";
import { DocusignEventSearchInput } from "../../../__generated__/resolvers-types";
import { IDocusignEvent } from "../../../models/docusignEvent";
import { adminOrOwnerOnly } from "../../../utils/access";
import { SearchResults } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";
import logger from "../../../utils/logger";

export const Query = {
  docusignEvents: async (
    _: unknown,
    { input }: { input: DocusignEventSearchInput },
    context: Context
  ): Promise<SearchResults<IDocusignEvent>> => {
    try {
      adminOrOwnerOnly(input.userId, context.user);
      return context.docusign.findEventsByUserId(input);
    } catch(error) {
      logger.error('Failed to fetch docusign events', { error });
      throw new GraphQLError('Failed to fetch docusign events');
    }
  }
};
