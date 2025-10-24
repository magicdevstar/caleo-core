import { gql } from "@apollo/client";

export const REMOVE_ASSIGNMENT_DIVISION = gql`
  mutation RemoveAssignmentDivision($id: String!) {
    removeAssignmentDivision(id: $id)
  }
`;

export const GET_ASSIGNMENT_DIVISIONS = gql`
  query GetAssignmentDivisions($input: AssignmentDivisionSearchInput!) {
    assignmentDivisions(input: $input) {
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

export const UPSERT_ASSIGNMENT_DIVISION = gql`
  mutation UpsertAssignmentDivision($input: UpsertAssignmentDivision!) {
    assignmentDivision(assignmentDivision: $input) {
      id
    }
  }
`;

export type AssignmentDivisionTableFilters = {
  name: string;
  active: string[];
};

export type AssignmentDivisionTableFilterValue = string | string[];
