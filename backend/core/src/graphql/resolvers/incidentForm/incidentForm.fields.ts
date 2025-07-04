import { IncidentFormStatus } from "../../../__generated__/resolvers-types";
import { IIncidentForm } from "../../../models/incidentForm";
import { commonResolvers } from "../../../utils/common.resolvers";
import { Context } from "../../../utils/createContext";

export const fields = {
  IncidentForm: {
    ...commonResolvers,
    status: (parent: IIncidentForm) => parent.envelopeId ? IncidentFormStatus.Submitted : IncidentFormStatus.Draft,
    docusignEvent: (parent: IIncidentForm, _: unknown, context: Context) => parent.envelopeId ? context.docusign.loadByEnvelopeId(parent.envelopeId) : null,
    reviewerUser: (parent: IIncidentForm, _: unknown, context: Context) => {
      if (!parent.reviewer) return null;
      return context.outsideUsers.loader.load(parent.reviewer.toString());
    },
    user: (parent: IIncidentForm, _: unknown, context: Context) => {
      if (!parent.userId) return null;
      return context.users.loader.load(parent.userId.toString());
    },
    event: (parent: IIncidentForm, _: unknown, context: Context) => {
      if (!parent.eventId) return null;
      return context.events.loader.load(parent.eventId.toString());
    }
  }
};
