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