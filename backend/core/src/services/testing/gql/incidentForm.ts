import gql from "graphql-tag";

export const CREATE_INCIDENT_SUBMISSION = gql`
  mutation IncidentForm($input: IIncidentForm!) {
    incidentForm(input: $input) {
      incidentForm {
        id
      }
    }
  }
`;

export const VOID_INCIDENT_FORM = gql`
  mutation VoidIncidentForm($id: ObjectId!, $voidReason: String) {
    voidIncidentForm(id: $id, voidReason: $voidReason)
  }
`;