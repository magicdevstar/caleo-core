import gql from "graphql-tag";

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
