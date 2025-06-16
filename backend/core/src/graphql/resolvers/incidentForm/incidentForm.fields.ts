import { IncidentForm, IncidentFormStatus } from "../../../__generated__/resolvers-types";
import { IIncidentForm } from "../../../models/incidentForm";
import { Context } from "../../../utils/createContext";

export const fields = {
  IncidentForm: {
    status: (parent: IncidentForm) => parent.envelopeId ? IncidentFormStatus.Submitted : IncidentFormStatus.Draft,
    docusignEvent: (parent: IIncidentForm, _: unknown, context: Context) => parent.envelopeId ? context.docusign.loadByUserAndEventId(parent.userId, parent.eventId) : null,
  }
};
