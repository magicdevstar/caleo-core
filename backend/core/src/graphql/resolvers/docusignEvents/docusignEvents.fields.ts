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
  }
};