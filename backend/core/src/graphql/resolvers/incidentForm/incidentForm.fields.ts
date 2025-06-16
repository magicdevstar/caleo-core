import { IncidentForm, IncidentFormStatus } from "../../../__generated__/resolvers-types";

export const fields = {
  IncidentForm: {
    status: (parent: IncidentForm) => parent.envelopeId ? IncidentFormStatus.Submitted : IncidentFormStatus.Draft,
  }
};
