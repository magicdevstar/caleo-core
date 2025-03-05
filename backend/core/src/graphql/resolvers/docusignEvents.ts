import { Context } from "../../utils/createContext";
import { baseResolvers, SearchResults } from "../../utils/common.resolvers";
import { IDocusignEvent } from "../../models/docusignEvent";
import { adminOrOwnerOnly } from "../../utils/access";
import { DocusignEventSearchInput } from "../../__generated__/resolvers-types";
import { GraphQLError } from "graphql";
import logger from "../../utils/logger";

export const docusignEvents = {
  Query: {
    docusignEvents: async (
      _: unknown,
      { input }: { input: DocusignEventSearchInput },
      context: Context
    ): Promise<SearchResults<IDocusignEvent>> => {
      try {
        if (input.userId) {
          adminOrOwnerOnly(input.userId, context.user);
        }
        return context.docusign.findEventsByUserId(input);
      } catch(error) {
        logger.error('Failed to fetch docusign events', { error });
        throw new GraphQLError('Failed to fetch docusign events');
      }
    }
  },
  fields: {
    DocusignEvent: {
      ...baseResolvers,
      shift: (
        event: IDocusignEvent,
        _: unknown,
        context: Context
      ) => context.shifts.loader.load(event.shiftId.toString()),
      documentUrl: (
        event: IDocusignEvent,
        _: unknown,
        context: Context
      ) => context.docusign.getDocumentUrl({
        event,
      }),
    }
  }
};
