import { gql } from "@apollo/client";

export const REMOVE_DIVISION = gql`
  mutation RemoveDivision($id: String!) {
    removeDivision(id: $id)
  }
`;

export const GET_DIVISIONS = gql`
  query GetDivisions($input: DivisionSearchInput!) {
    divisions(input: $input) {
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

export const UPSERT_DIVISION = gql`
  mutation UpsertDivision($input: UpsertDivision!) {
    division(division: $input) {
      id
    }
  }
`;

export type DivisionTableFilters = {
  name: string;
  active: string[];
};

export type DivisionTableFilterValue = string | string[];
