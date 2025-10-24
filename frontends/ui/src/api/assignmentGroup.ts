import { gql } from "@apollo/client";

export const REMOVE_ASSIGNMENT_GROUP = gql`
  mutation RemoveAssignmentGroup($id: String!) {
    removeAssignmentGroup(id: $id)
  }
`;

export const GET_ASSIGNMENT_GROUPS = gql`
  query GetAssignmentGroups($input: AssignmentGroupSearchInput!) {
    assignmentGroups(input: $input) {
      items {
        id
        name
        active
        createdAt
      }
      total
    }
  }
`;

export const UPSERT_ASSIGNMENT_GROUP = gql`
  mutation UpsertAssignmentGroup($input: UpsertAssignmentGroup!) {
    assignmentGroup(assignmentGroup: $input) {
      id
    }
  }
`;

export type AssignmentGroupTableFilters = {
  name: string;
  active: string[];
};

export type AssignmentGroupTableFilterValue = string | string[];
