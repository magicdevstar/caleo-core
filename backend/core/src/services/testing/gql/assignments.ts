import gql from "graphql-tag";

export const CREATE_ASSIGNMENT = gql`
  mutation CreateAssignment($input: UpsertAssignment!) {
    assignment(assignment: $input) {
      id
      event {
        id
        assignmentIds
      }
      name
      description
    }
  }
`;

export const REMOVE_ASSIGNMENT = gql`
  mutation RemoveAssignment($id: String!) {
    removeAssignment(id: $id)
  }
`;
