import { IDocusignEvent } from "../../../models/docusignEvent";
import { baseResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  DocusignEvent: {
    ...baseResolvers,
    shift: (
      event: IDocusignEvent,
      _: unknown,
      context: Context
    ) => event.shiftId ? context.shifts.loader.load(event.shiftId.toString()) : null,
    documentUrl: (
      event: IDocusignEvent,
      _: unknown,
      context: Context
    ) => context.docusign.getDocumentUrl({
      event,
    }),
    documentUrls: async (
      event: IDocusignEvent,
      _: unknown,
      context: Context
    ) => {
      const doc1 = await context.docusign.getDocumentUrl({
        event,
      });
      const doc2 = await context.docusign.getDocumentUrl({
        event,
        docId: '2',
      });
      return [doc1, doc2].filter(Boolean);
    },
  }
};